"""Publish aggregate portfolio activity from this computer to an isolated data branch."""

from collections import Counter
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import subprocess
from urllib.error import HTTPError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
HOME = Path.home()
KST = timezone(timedelta(hours=9))
DAY = timedelta(days=1)
REF = "refs/heads/activity-data"
GITLAB = "https://lab.ssafy.com"


def local_day(timestamp):
    return datetime.fromisoformat(timestamp).astimezone(KST).date()


def records(path):
    with path.open(encoding="utf-8") as log:
        for line in log:
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                # A live session may still be writing its last record.
                continue


def codex_usage(start):
    home = Path(os.environ.get("CODEX_HOME", HOME / ".codex"))
    folders = [home / "sessions", home / "archived_sessions"]
    if not any(folder.is_dir() for folder in folders):
        raise RuntimeError("Codex session logs are unavailable")
    totals = Counter()
    seen = set()
    for folder in folders:
        for path in folder.rglob("*.jsonl"):
            if datetime.fromtimestamp(path.stat().st_mtime, KST).date() < start:
                continue
            previous = 0
            for event in records(path):
                if event.get("type") != "event_msg":
                    continue
                payload = event.get("payload") or {}
                info = payload.get("info") or {}
                if payload.get("type") != "token_count" or not info:
                    continue
                cumulative = (info.get("total_token_usage") or {}).get("total_tokens")
                if not isinstance(cumulative, int) or cumulative < 0:
                    continue
                recent = (info.get("last_token_usage") or {}).get("total_tokens", 0)
                delta = cumulative - previous if cumulative >= previous else recent
                if previous == 0 and recent and cumulative > recent:
                    # A resumed transcript can start with a running balance.
                    delta = recent
                previous = cumulative
                timestamp = event.get("timestamp")
                if not timestamp or delta <= 0:
                    continue
                day = local_day(timestamp)
                key = (timestamp, cumulative)
                if day >= start and key not in seen:
                    totals[day] += delta
                    seen.add(key)
    return totals


def claude_usage(start):
    folder = Path(os.environ.get("CLAUDE_CONFIG_DIR", HOME / ".claude")) / "projects"
    if not folder.is_dir():
        raise RuntimeError("Claude project logs are unavailable")
    messages = {}
    for path in folder.rglob("*.jsonl"):
        if datetime.fromtimestamp(path.stat().st_mtime, KST).date() < start:
            continue
        for event in records(path):
            if event.get("type") != "assistant" or not event.get("timestamp"):
                continue
            message = event.get("message") or {}
            usage = message.get("usage")
            identity = message.get("id")
            if not usage or not identity or message.get("model") == "<synthetic>":
                continue
            day = local_day(event["timestamp"])
            amount = sum(usage.get(field) or 0 for field in (
                "input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens",
            ))
            if identity in messages:
                first_day, largest_amount = messages[identity]
                day, amount = min(day, first_day), max(amount, largest_amount)
            messages[identity] = (day, amount)
    totals = Counter()
    for day, amount in messages.values():
        if day >= start:
            totals[day] += amount
    return totals


def request(url, headers=None):
    return urlopen(Request(url, headers={"User-Agent": "portfolio-activity", **(headers or {})}), timeout=20)


class GithubCalendar(HTMLParser):
    def __init__(self):
        super().__init__()
        self.days = {}

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "td" and "data-date" in attrs and "data-level" in attrs:
            self.days[date.fromisoformat(attrs["data-date"])] = attrs["data-level"] != "0"


def github_days(start, today):
    query = urlencode({"from": start, "to": today})
    with request(f"https://github.com/users/rl2aderjoon/contributions?{query}") as response:
        calendar = GithubCalendar()
        calendar.feed(response.read().decode())
    if start not in calendar.days or today not in calendar.days:
        raise RuntimeError("GitHub public calendar did not include the requested dates")
    return {day for day, active in calendar.days.items() if active}


def git(*arguments, cwd=ROOT, data=None, env=None):
    return subprocess.run(
        ["git", *arguments], cwd=cwd, input=data, stdout=subprocess.PIPE, check=True,
        env=env, encoding="utf-8", errors="replace",
    ).stdout.strip()


def gitlab_api_days(start, token):
    headers = {"PRIVATE-TOKEN": token, "Accept": "application/json"}
    with request(f"{GITLAB}/api/v4/user", headers) as response:
        user = json.load(response)
    if user.get("username") != "rleaderjoon":
        raise RuntimeError("The GitLab token belongs to a different account")
    days = set()
    page = "1"
    while page:
        query = urlencode({"after": start - DAY, "per_page": 100, "page": page})
        with request(f"{GITLAB}/api/v4/users/{user['id']}/events?{query}", headers) as response:
            days.update(local_day(item["created_at"]) for item in json.load(response))
            page = response.headers.get("X-Next-Page") or ""
    return days


def gitlab_checkout_days(start):
    email = git("config", "user.email").casefold()
    days = set()
    checkouts = 0
    skip = {"node_modules", ".venv", "venv", ".claude", ".codex", "dist", "build", "__pycache__"}
    for current, folders, files in os.walk(HOME / "Desktop"):
        folders[:] = [folder for folder in folders if folder not in skip and not folder.startswith(".")]
        if not (Path(current) / ".git").exists():
            continue
        folders.clear()
        remotes = git("config", "--get-regexp", r"^remote\..*\.url$", cwd=current) if git("remote", cwd=current) else ""
        urls = [line.split(maxsplit=1)[1] for line in remotes.splitlines()]
        if not any(urlsplit(url).hostname == "lab.ssafy.com" or url.startswith("git@lab.ssafy.com:") for url in urls):
            continue
        checkouts += 1
        log = git("log", "--all", f"--since-as-filter={start - DAY}T00:00:00+09:00", "--format=%aE%x09%aI", cwd=current)
        for line in log.splitlines():
            author, timestamp = line.split("\t", 1)
            if author.casefold() == email:
                days.add(local_day(timestamp))
    return days, "checkouts" if checkouts else "unavailable"


def gitlab_days(start):
    token = os.environ.get("GITLAB_TOKEN")
    if token:
        try:
            return gitlab_api_days(start, token), "api"
        except HTTPError as error:
            if error.code not in (401, 403):
                raise
    return gitlab_checkout_days(start)


def build_snapshot(now):
    today = now.date()
    yesterday = today - DAY
    activity_start = today - 89 * DAY
    token_start = yesterday - 89 * DAY
    codex = codex_usage(token_start)
    claude = claude_usage(token_start)
    github = github_days(activity_start, today)
    gitlab, gitlab_source = gitlab_days(activity_start)
    activity = github | gitlab | {day for day, value in (codex + claude).items() if value}
    dates = [activity_start + index * DAY for index in range(90)]
    usage = []
    for length in (1, 7, 30):
        codex_total = sum(codex[yesterday - offset * DAY] for offset in range(length))
        claude_total = sum(claude[yesterday - offset * DAY] for offset in range(length))
        max_total = max(
            sum(codex[token_start + offset * DAY] + claude[token_start + offset * DAY] for offset in range(index, index + length))
            for index in range(91 - length)
        )
        usage.append({"days": length, "codex": codex_total, "claude": claude_total, "max": max_total})
    return {
        "updated": now.isoformat(timespec="seconds"),
        "through": yesterday.isoformat(),
        "gitlab": gitlab_source,
        "activity": [[day.isoformat(), day in activity] for day in dates],
        "tokens": usage,
    }


def publish(snapshot):
    environment = {
        **os.environ,
        "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never",
        "GIT_AUTHOR_NAME": "Portfolio activity", "GIT_AUTHOR_EMAIL": "activity@users.noreply.github.com",
        "GIT_COMMITTER_NAME": "Portfolio activity", "GIT_COMMITTER_EMAIL": "activity@users.noreply.github.com",
    }
    parents = []
    if git("ls-remote", "--heads", "origin", REF, env=environment):
        git("fetch", "--no-tags", "origin", REF, env=environment)
        parents = ["-p", git("rev-parse", "FETCH_HEAD", env=environment)]
    payload = json.dumps(snapshot, ensure_ascii=True, separators=(",", ":")) + "\n"
    blob = git("hash-object", "-w", "--stdin", data=payload, env=environment)
    tree = git("mktree", "-z", data=f"100644 blob {blob}\tactivity.json\0", env=environment)
    commit = git("commit-tree", tree, *parents, "-m", "Refresh portfolio activity", env=environment)
    git("push", "origin", f"{commit}:{REF}", env=environment)
    print(f"Published {commit[:10]}; GitLab source: {snapshot['gitlab']}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    snapshot = build_snapshot(datetime.now(KST))
    if args.publish:
        publish(snapshot)
    else:
        print(f"GitLab source: {snapshot['gitlab']}; active days: {sum(active for _, active in snapshot['activity'])}")
        for period in snapshot["tokens"]:
            print(f"{period['days']}d: Codex {period['codex']:,}, Claude {period['claude']:,}")
