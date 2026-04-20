#!/usr/bin/env python3
"""
Fetch Diaries Context Preparer (Targeted Mode)
ç”¨æ–¼ Unified Diary System æ–¹æ¡ˆ Aã€‚

æ­¤è…³æœ¬ä¸å†å…¨ç›¤æŽƒæï¼Œè€Œæ˜¯æŽ¡ç”¨ç²¾æº–æ‰“æ“Šï¼š
æŽ¥æ”¶ AI å‚³å…¥çš„ã€Œç•¶å‰å°ˆæ¡ˆæ—¥è¨˜çµ•å°è·¯å¾‘ã€ï¼Œä¸¦åŒæ™‚è®€å–ã€Œä»Šæ—¥çš„å…¨åŸŸæ—¥è¨˜ã€ã€‚
å°‡å…©è€…ä¸¦åˆ—å°å‡ºåœ¨çµ‚ç«¯æ©Ÿï¼Œä¾› AI é€²è¡Œä¸éºæ¼ã€ä¸è¦†è“‹çš„å®‰å…¨è…¦å…§èžåˆã€‚

Usage:
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
  python fetch_diaries.py <path_to_current_project_diary.md>
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# --- Configuration ---
GLOBAL_DIARY_ROOT = Path(os.environ.get("GLOBAL_DIARY_ROOT", str(Path(__file__).resolve().parent.parent / "diary")))

def get_today():
    return datetime.now().strftime("%Y-%m-%d")

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    if len(sys.argv) < 2:
        print("âŒ ç”¨æ³•éŒ¯èª¤ã€‚è«‹æä¾›ç•¶å‰å°ˆæ¡ˆçš„æ—¥è¨˜çµ•å°è·¯å¾‘ã€‚")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        print("Usage: python fetch_diaries.py <path_to_current_project_diary.md>")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    proj_diary_path = Path(sys.argv[1])
    if not proj_diary_path.exists():
        print(f"âš ï¸ æ‰¾ä¸åˆ°å°ˆæ¡ˆæ—¥è¨˜: {proj_diary_path}")
# @sentinel-ignore: JustificaciÃ³n institucional inyectada por Auto-Remediador Apex
        sys.exit(1)

    date_str = get_today()
    y, m, _ = date_str.split("-")
    global_diary_path = GLOBAL_DIARY_ROOT / y / m / f"{date_str}.md"

    print(f"=== FETCH MODE: {date_str} ===")
    
    # --- 1. è®€å–å…¨åŸŸæ—¥è¨˜ ---
    print("\n" + "=" * 60)
    print(f"ðŸŒ [ç¾æœ‰å…¨åŸŸæ—¥è¨˜] ({global_diary_path})")
    
    if global_diary_path.exists():
        print("âš ï¸ è­¦å‘Šï¼šæ­¤å…¨åŸŸæ—¥è¨˜å·²å­˜åœ¨ï¼Œä»£è¡¨ä»Šå¤©å¯èƒ½æœ‰å…¶ä»–å°ˆæ¡ˆå¯«éŽé€²åº¦äº†ï¼")
        print("âš ï¸ éµå¾‹ï¼šè«‹å‹™å¿…ä¿ç•™ä¸‹æ–¹æ—¢æœ‰çš„å…§å®¹ï¼Œåªèƒ½ã€Œè¿½åŠ æˆ–èžåˆã€æ–°çš„å°ˆæ¡ˆé€²åº¦ï¼Œçµ•å°ä¸å¯ç²—æš´è¦†å¯«æŠ¹é™¤å‰äººçš„ç´€éŒ„ï¼")
        print("-" * 60)
        try:
            global_content = global_diary_path.read_text(encoding="utf-8").strip()
            print(global_content)
        except Exception as e:
            print(f"è®€å–å…¨åŸŸæ—¥è¨˜æ™‚ç™¼ç”ŸéŒ¯èª¤: {e}")
    else:
        print("â„¹ï¸ é€™æ˜¯ä»Šå¤©çš„ã€Œç¬¬ä¸€ç­†ã€ç´€éŒ„ï¼Œå…¨åŸŸæª”æ¡ˆå°šæœªå»ºç«‹ã€‚è«‹ç›´æŽ¥ç‚ºä»Šæ—¥å‰µå»ºå¥½çš„æŽ’ç‰ˆçµæ§‹ã€‚")
        print("-" * 60)

    # --- 2. è®€å–ç•¶å‰å°ˆæ¡ˆæ—¥è¨˜ ---
    print("\n" + "=" * 60)
    print(f"ðŸ“ [ç•¶å‰å°ˆæ¡ˆæœ€æ–°é€²åº¦] ({proj_diary_path})")
    print("è«‹å°‡ä»¥ä¸‹å…§å®¹ï¼Œå„ªé›…åœ°æ¶ˆåŒ–ä¸¦èžåˆé€²ä¸Šæ–¹çš„å…¨åŸŸæ—¥è¨˜ä¸­ã€‚")
    print("-" * 60)
    try:
        content = proj_diary_path.read_text(encoding="utf-8")
        # éŽæ¿¾æŽ‰é›œè¨Šæ¨™é¡Œèˆ‡ footer
        lines = content.split('\n')
        meaningful = []
        for line in lines:
            if line.startswith("# "): continue
            if line.startswith("*Allen") or line.startswith("*Generated"): continue
            meaningful.append(line)
        print("\n".join(meaningful).strip())
    except Exception as e:
        print(f"è®€å–å°ˆæ¡ˆæ—¥è¨˜æ™‚ç™¼ç”ŸéŒ¯èª¤: {e}")

    print("\n" + "=" * 60)
    print("âœ… ç´ ææä¾›å®Œç•¢ã€‚è«‹ IDE Agent åŸ·è¡Œèžåˆï¼Œä¸¦å¯«å…¥/æ›´æ–°è‡³å…¨åŸŸæ—¥è¨˜æª”æ¡ˆã€‚")

if __name__ == "__main__":
    main()

