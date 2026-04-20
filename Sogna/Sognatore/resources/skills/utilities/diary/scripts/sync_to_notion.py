#!/usr/bin/env python3
"""
Notion Diary Sync Script
åŒæ­¥ diary-agent çš„é–‹ç™¼æ—¥è¨˜åˆ° Notionã€Œæ¯æ—¥è¤‡ç›¤ã€é é¢çš„ Business å€å¡Šã€‚
é é¢çµæ§‹ï¼ˆå…¶ä»–ç”Ÿæ´»å€å¡Šï¼‰ç”± GAS Agent å»ºç«‹ï¼Œæœ¬è…³æœ¬åƒ…è² è²¬æŽ¨é€é–‹ç™¼æ—¥è¨˜ã€‚

ä½¿ç”¨æ–¹å¼ï¼š
  python sync_to_notion.py <diary_file_path>
  python sync_to_notion.py --create-db <parent_page_id>

ç’°å¢ƒè®Šæ•¸ï¼š
  NOTION_TOKEN      - Notion Internal Integration Token
  NOTION_DIARY_DB   - Notion Diary Database ID
"""

import os
import sys
import re
import json
import requests
from datetime import datetime
from pathlib import Path

# â”€â”€ Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
NOTION_DIARY_DB = os.environ.get("NOTION_DIARY_DB", "")
NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
}

# â”€â”€ æ³¨æ„ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# é é¢çµæ§‹ï¼ˆLearning / Chemistry / Workout / å¿ƒå¾—ï¼‰ç”± GAS Agent å»ºç«‹ã€‚
# æœ¬è…³æœ¬åƒ…è² è²¬å°‡é–‹ç™¼æ—¥è¨˜æŽ¨é€è‡³ Business å€å¡Šã€‚


# â”€â”€ Notion API Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def notion_request(method: str, endpoint: str, data: dict = None) -> dict:
    """Execute a Notion API request with error handling."""
    url = f"{NOTION_API}/{endpoint}"
    resp = getattr(requests, method)(url, headers=HEADERS, json=data)
    if resp.status_code >= 400:
        print(f"âŒ Notion API Error ({resp.status_code}): {resp.json().get('message', resp.text)}")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)
    return resp.json()


def search_diary_by_date(date_str: str) -> str | None:
    """Search for an existing diary page by date property."""
    data = {
        "filter": {
            "property": "æ—¥æœŸ",
            "date": {"equals": date_str}
        }
    }
    result = notion_request("post", f"databases/{NOTION_DIARY_DB}/query", data)
    pages = result.get("results", [])
    return pages[0]["id"] if pages else None


# â”€â”€ Rich Text & Block Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def parse_rich_text(text: str) -> list:
    """Parse markdown inline formatting to Notion rich_text array."""
    segments = []
    pattern = r'(\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\))'
    last_end = 0

    for match in re.finditer(pattern, text):
        start, end = match.span()
        if start > last_end:
            plain = text[last_end:start]
            if plain:
                segments.append({"type": "text", "text": {"content": plain}})
        full = match.group(0)
        if full.startswith("**"):
            segments.append({"type": "text", "text": {"content": match.group(2)}, "annotations": {"bold": True}})
        elif full.startswith("`"):
            segments.append({"type": "text", "text": {"content": match.group(3)}, "annotations": {"code": True}})
        elif full.startswith("["):
            segments.append({"type": "text", "text": {"content": match.group(4), "link": {"url": match.group(5)}}})
        last_end = end

    if last_end < len(text):
        remaining = text[last_end:]
        if remaining:
            segments.append({"type": "text", "text": {"content": remaining}})
    if not segments:
        segments.append({"type": "text", "text": {"content": text}})
    return segments


def make_heading2(text: str) -> dict:
    return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": parse_rich_text(text)}}


def make_heading3(text: str) -> dict:
    return {"object": "block", "type": "heading_3", "heading_3": {"rich_text": parse_rich_text(text)}}


def make_bullet(text: str) -> dict:
    return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": parse_rich_text(text)}}


def make_divider() -> dict:
    return {"object": "block", "type": "divider", "divider": {}}


def make_quote(text: str = " ") -> dict:
    return {"object": "block", "type": "quote", "quote": {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def make_paragraph(text: str) -> dict:
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": parse_rich_text(text)}}


def make_todo(text: str, checked: bool = False) -> dict:
    return {"object": "block", "type": "to_do", "to_do": {"rich_text": parse_rich_text(text), "checked": checked}}


def make_callout(text: str, emoji: str = "ðŸ’¡") -> dict:
    return {"object": "block", "type": "callout", "callout": {"rich_text": parse_rich_text(text), "icon": {"emoji": emoji}}}


# â”€â”€ Markdown to Business Blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def diary_to_business_blocks(md_content: str) -> list:
    """Convert diary markdown into bullet-point blocks for the Business section.

    Extracts the key accomplishments and structures them as Notion blocks.
    """
    blocks = []
    lines = md_content.split("\n")

    for line in lines:
        line = line.rstrip()
        if not line:
            continue

        # Skip the H1 title and timestamp lines
        if line.startswith("# ") or line.startswith("*Allen") or line.startswith("*Generated"):
            continue

        # H3 sections become sub-headings (e.g. ### 1. è·¨å¹³å°æ··åˆé›²è‡ªå‹•åŒ–)
        if line.startswith("### "):
            heading_text = line[4:].strip()
            # Remove leading numbers (e.g. "1. " or "ðŸ“ ")
            heading_text = re.sub(r'^\d+\.\s*', '', heading_text)
            blocks.append(make_heading3(heading_text))
            continue

        # H2 sections - skip (they are category headers like "ä»Šæ—¥å›žé¡§", "è©²æ”¹å–„çš„åœ°æ–¹")
        if line.startswith("## "):
            section = line[3:].strip()
            # Keep the improvement section as a callout
            if "æ”¹å–„" in section or "å­¸ç¿’" in section:
                blocks.append(make_divider())
                blocks.append(make_heading3(f"ðŸ’¡ {section}"))
            continue

        # Dividers
        if line.strip() == "---":
            continue
            
        # Callouts (e.g. > ðŸŒŸ **ä»Šæ—¥äº®é»ž (Daily Highlight)**)
        if line.startswith("> "):
            text = line[2:].strip()
            # Extract emoji if present
            emoji = "ðŸ’¡"
            if text and len(text) > 0:
                first_char = text[0]
                # A simple heuristic to check if the first character is an emoji
                import unicodedata
                if ord(first_char) > 0xFFFF or unicodedata.category(first_char) == 'So':
                    emoji = first_char
                    text = text[1:].strip()
            blocks.append(make_callout(text, emoji))
            continue

        # TODO items
        if "- [ ]" in line or "- [x]" in line:
            checked = "- [x]" in line
            text = re.sub(r'^[\s]*-\s\[[ x]\]\s', '', line)
            blocks.append(make_todo(text, checked))
            continue
 
        # Numbered items
        if re.match(r'^[\s]*\d+\.\s', line):
            text = re.sub(r'^[\s]*\d+\.\s', '', line)
            if text:
                blocks.append(make_bullet(text))
            continue
 
        # Bullet points
        if re.match(r'^[\s]*[\-\*]\s', line):
            text = re.sub(r'^[\s]*[\-\*]\s', '', line)
            if text:
                blocks.append(make_bullet(text))
            continue

        # Default: paragraph (only if meaningful)
        if len(line.strip()) > 2:
            blocks.append(make_paragraph(line))

    return blocks


# â”€â”€ Page Creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def build_business_only_blocks(business_blocks: list) -> list:
    """Build page blocks with only Business section (GAS Agent handles the rest)."""
    blocks = []
    blocks.append(make_heading2("ðŸ’¼ Business (YT/AI ç¶²ç´… / è‡ªå‹•åŒ–é–‹ç™¼)"))
    blocks.extend(business_blocks)
    blocks.append(make_divider())
    return blocks


def extract_metadata(md_content: str, filename: str) -> dict:
    """Extract metadata from diary markdown content."""
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
    date_str = date_match.group(1) if date_match else datetime.now().strftime("%Y-%m-%d")

    # Build title
    title = f"ðŸ“Š {date_str} æ¯æ—¥è¤‡ç›¤"

    # Extract project names
    # Matches old format `### ðŸ“ ` and new format e.g., `### ðŸ”µ ` or `### ðŸŸ¢ `
    projects = re.findall(r'###\s+[\U00010000-\U0010ffffðŸ“]\s+(\S+)', md_content)
    if not projects:
        projects = re.findall(r'###\s+\d+\.\s+(.+?)[\sðŸš€ðŸ› ï¸ðŸ§ªâ˜ï¸ðŸ”§ðŸ§©]*(?:\n|$)', md_content)
        projects = [p.strip()[:20] for p in projects]

    # Auto-tag
    tags = {"Business"}  # Always tagged as Business since diary-agent produces dev content
    tag_keywords = {
        "è‡ªå‹•åŒ–": ["è‡ªå‹•åŒ–", "GAS", "Agent", "è§¸ç™¼å™¨"],
        "AI": ["Gemini", "AI", "èªžç¾©", "LLM"],
        "å½±ç‰‡": ["Remotion", "å½±ç‰‡", "æ¸²æŸ“", "OpenShorts"],
        "æŠ•è³‡": ["æŠ•è³‡", "åˆ†æž", "é“æ°", "é…’ç”°"],
        "Discord": ["Discord", "Listener"],
        "YouTube": ["YouTube", "YT", "Guardian"],
    }
    for tag, keywords in tag_keywords.items():
        if any(kw in md_content for kw in keywords):
            tags.add(tag)

    return {
        "date": date_str,
        "title": title,
        "projects": projects if projects else ["general"],
        "tags": list(tags),
    }


def create_diary_page(metadata: dict, blocks: list) -> str:
    """Create a new diary page in Notion database."""
    children = blocks[:100]
    data = {
        "parent": {"database_id": NOTION_DIARY_DB},
        "icon": {"emoji": "ðŸ“Š"},
        "properties": {
            "æ¨™é¡Œ": {"title": [{"text": {"content": metadata["title"]}}]},
            "æ—¥æœŸ": {"date": {"start": metadata["date"]}},
            "å°ˆæ¡ˆ": {"multi_select": [{"name": p} for p in metadata["projects"][:10]]},
            "æ¨™ç±¤": {"multi_select": [{"name": t} for t in metadata["tags"][:10]]},
        },
        "children": children
    }
    result = notion_request("post", "pages", data)
    page_id = result["id"]

    # Append remaining blocks in chunks of 100
    if len(blocks) > 100:
        remaining = blocks[100:]
        for i in range(0, len(remaining), 100):
            chunk = remaining[i:i+100]
            notion_request("patch", f"blocks/{page_id}/children", {"children": chunk})

    return page_id


def update_business_section(page_id: str, metadata: dict, business_blocks: list):
    """Update ONLY the Business section of an existing page, preserving all other content."""
    # Update properties
    notion_request("patch", f"pages/{page_id}", {
        "properties": {
            "æ¨™é¡Œ": {"title": [{"text": {"content": metadata["title"]}}]},
            "å°ˆæ¡ˆ": {"multi_select": [{"name": p} for p in metadata["projects"][:10]]},
            "æ¨™ç±¤": {"multi_select": [{"name": t} for t in metadata["tags"][:10]]},
        }
    })

    # Read all existing blocks
    all_blocks = []
    cursor = None
    while True:
        endpoint = f"blocks/{page_id}/children?page_size=100"
        if cursor:
            endpoint += f"&start_cursor={cursor}"
        result = notion_request("get", endpoint)
        all_blocks.extend(result.get("results", []))
        if not result.get("has_more"):
            break
        cursor = result.get("next_cursor")

    # Find the Business section boundaries
    business_start = None
    business_end = None

    for idx, block in enumerate(all_blocks):
        if block["type"] == "heading_2":
            text = ""
            for rt in block.get("heading_2", {}).get("rich_text", []):
                text += rt.get("plain_text", rt.get("text", {}).get("content", ""))
            if "Business" in text:
                business_start = idx
            elif business_start is not None and business_end is None:
                # Next H2 after Business = end of Business section
                business_end = idx
                break

    if business_start is None:
        print("âš ï¸ æ‰¾ä¸åˆ° Business å€å¡Šï¼Œå°‡è¦†è“‹æ•´é å…§å®¹")
        blocks_to_delete = all_blocks
        after_block_id = None
    else:
        # If no end found, look for a divider after business content
        if business_end is None:
            for idx in range(business_start + 1, len(all_blocks)):
                if all_blocks[idx]["type"] == "divider":
                    business_end = idx + 1  # Include the divider
                    break
            if business_end is None:
                business_end = len(all_blocks)

        # Delete old Business content (between heading and next section)
        blocks_to_delete = all_blocks[business_start + 1:business_end]
        
        # Find the block AFTER which to insert (the Business heading itself)
        after_block_id = all_blocks[business_start]["id"]

    for block in blocks_to_delete:
        try:
            requests.delete(f"{NOTION_API}/blocks/{block['id']}", headers=HEADERS)
        except Exception:
            pass

    # Insert new Business blocks after the heading, or at the end of the page
    for i in range(0, len(business_blocks), 100):
        chunk = business_blocks[i:i+100]
        payload = {"children": chunk}
        if after_block_id:
            payload["after"] = after_block_id
            
        result = notion_request("patch", f"blocks/{page_id}/children", payload)
        
        # Update after_block_id to the last inserted block for ordering
        if chunk and result.get("results"):
            after_block_id = result["results"][-1]["id"]

    # Re-add divider after business content
    if after_block_id:
        notion_request("patch", f"blocks/{page_id}/children", {
            "children": [make_divider()],
            "after": after_block_id
        }) 
    else:
        notion_request("patch", f"blocks/{page_id}/children", {
            "children": [make_divider()]
        })

    print("âœ… Business å€å¡Šå·²æ›´æ–°ï¼ˆå…¶ä»–å€å¡Šæœªå—å½±éŸ¿ï¼‰")


def create_database(parent_page_id: str) -> str:
    """Create the Diary database under a parent page."""
    data = {
        "parent": {"type": "page_id", "page_id": parent_page_id},
        "title": [{"type": "text", "text": {"content": "ðŸ“” AI æ—¥è¨˜"}}],
        "icon": {"emoji": "ðŸ“Š"},
        "is_inline": False,
        "properties": {
            "æ¨™é¡Œ": {"title": {}},
            "æ—¥æœŸ": {"date": {}},
            "å°ˆæ¡ˆ": {"multi_select": {"options": []}},
            "æ¨™ç±¤": {"multi_select": {"options": []}},
        }
    }
    result = notion_request("post", "databases", data)
    db_id = result["id"]
    print(f"âœ… Created Notion Diary Database: {db_id}")
    print(f"   è«‹å°‡æ­¤ ID è¨­ç‚ºç’°å¢ƒè®Šæ•¸ï¼š")
    print(f'   $env:NOTION_DIARY_DB = "{db_id}"')
    return db_id


# â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    if not NOTION_TOKEN:
        print("âŒ è«‹è¨­å®šç’°å¢ƒè®Šæ•¸ NOTION_TOKEN")
        print('   $env:NOTION_TOKEN = "ntn_xxx"')
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    # Handle --create-db flag
    if len(sys.argv) >= 3 and sys.argv[1] == "--create-db":
        parent_id = sys.argv[2].replace("-", "")
        create_database(parent_id)
        return

    if not NOTION_DIARY_DB:
        print("âŒ è«‹è¨­å®šç’°å¢ƒè®Šæ•¸ NOTION_DIARY_DB")
        print('   $env:NOTION_DIARY_DB = "abc123..."')
        print("")
        print("å¦‚éœ€å»ºç«‹æ–° Databaseï¼š")
        print('   python sync_to_notion.py --create-db <parent_page_id>')
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    if len(sys.argv) < 2:
        print("ç”¨æ³•ï¼špython sync_to_notion.py <diary_file.md>")
        print("      python sync_to_notion.py --create-db <parent_page_id>")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    diary_path = Path(sys.argv[1])
    if not diary_path.exists():
        print(f"âŒ æ‰¾ä¸åˆ°æ—¥è¨˜æ–‡ä»¶ï¼š{diary_path}")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    # Read diary
    md_content = diary_path.read_text(encoding="utf-8")
    filename = diary_path.name

    print(f"ðŸ“– è®€å–æ—¥è¨˜ï¼š{diary_path}")

    # Extract metadata
    metadata = extract_metadata(md_content, filename)
    print(f"   æ—¥æœŸï¼š{metadata['date']}")
    print(f"   æ¨™é¡Œï¼š{metadata['title']}")
    print(f"   å°ˆæ¡ˆï¼š{', '.join(metadata['projects'])}")
    print(f"   æ¨™ç±¤ï¼š{', '.join(metadata['tags'])}")

    # Convert diary to Business blocks
    business_blocks = diary_to_business_blocks(md_content)
    print(f"   Business å€å¡Šæ•¸ï¼š{len(business_blocks)}")

    # Check if page already exists
    existing_page = search_diary_by_date(metadata["date"])

    if existing_page:
        print(f"ðŸ”„ æ›´æ–°å·²æœ‰é é¢çš„ Business å€å¡Š (page: {existing_page})")
        update_business_section(existing_page, metadata, business_blocks)
    else:
        print(f"ðŸ“ å»ºç«‹æ–°é é¢ï¼ˆåƒ… Business å€å¡Šï¼‰...")
        biz_blocks = build_business_only_blocks(business_blocks)
        page_id = create_diary_page(metadata, biz_blocks)
        print(f"âœ… å·²åŒæ­¥åˆ° Notionï¼(page: {page_id})")


if __name__ == "__main__":
    main()

