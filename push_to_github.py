"""
NAB-DT3 Work Permit System - GitHub Repository Auto-Pusher Script
Uses Python urllib.request to create a repository and upload all files via GitHub API.
"""

import os
import json
import base64
import urllib.request
import urllib.error

def push_to_github(token, repo_name="nab-dt3-work-permit-system", is_private=False):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Antigravity-GitHub-Pusher"
    }

    # 1. Get User Info
    print("Checking GitHub user info...")
    req_user = urllib.request.Request("https://api.github.com/user", headers=headers)
    try:
        with urllib.request.urlopen(req_user) as resp:
            user_data = json.loads(resp.read().decode())
            username = user_data["login"]
            print(f"Authenticated as GitHub user: {username}")
    except urllib.error.HTTPError as e:
        print(f"Authentication failed: {e.code} {e.reason}")
        return False

    # 2. Create Repository
    print(f"Creating repository '{repo_name}' on GitHub...")
    repo_payload = {
        "name": repo_name,
        "description": "NAB-DT3 Site Work Permit System & Realtime Safety Tracker Dashboard (CBRE Facility Management)",
        "private": is_private,
        "auto_init": True
    }
    
    req_repo = urllib.request.Request(
        "https://api.github.com/user/repos",
        data=json.dumps(repo_payload).encode(),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req_repo) as resp:
            repo_res = json.loads(resp.read().decode())
            print(f"Repository created: {repo_res['html_url']}")
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print(f"Repository '{repo_name}' already exists. Uploading files directly...")
        else:
            print(f"Failed to create repository: {e.code} {e.reason}")

    # 3. List of files to upload
    files_to_upload = ["index.html", "style.css", "app.js", "data.js", "README.md", "permits_clean.json"]
    
    for filename in files_to_upload:
        if not os.path.exists(filename):
            continue
            
        print(f"Uploading {filename}...")
        with open(filename, "rb") as f:
            content_bytes = f.read()
            encoded_content = base64.b64encode(content_bytes).decode('utf-8')

        url = f"https://api.github.com/repos/{username}/{repo_name}/contents/{filename}"
        
        # Check if file exists to get sha
        sha = None
        req_get = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req_get) as resp:
                existing_file = json.loads(resp.read().decode())
                sha = existing_file.get("sha")
        except Exception:
            pass

        put_payload = {
            "message": f"Add {filename} for NAB-DT3 Work Permit System",
            "content": encoded_content
        }
        if sha:
            put_payload["sha"] = sha

        req_put = urllib.request.Request(
            url,
            data=json.dumps(put_payload).encode(),
            headers=headers,
            method="PUT"
        )

        try:
            with urllib.request.urlopen(req_put) as resp:
                print(f"Successfully uploaded {filename}")
        except urllib.error.HTTPError as e:
            print(f"Error uploading {filename}: {e.code} {e.reason}")

    print("\n" + "="*60)
    print(f"🎉 SUCCESS! Repository is live at: https://github.com/{username}/{repo_name}")
    print(f"🌐 Enable GitHub Pages under Settings > Pages to publish your live link!")
    print("="*60)
    return True

if __name__ == "__main__":
    import sys
    token = sys.argv[1] if len(sys.argv) > 1 else input("Enter your GitHub Personal Access Token: ").strip()
    if token:
        push_to_github(token)
    else:
        print("No token provided.")
