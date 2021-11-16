#!/usr/bin/bash
readonly USERPAGEID=671442
if ! command -v awk curl >/dev/null; then
  echo "Install: awk, curl">&2
  exit 1
fi
curl -sL 'https://greasyfork.org/en/users/'"$USERPAGEID" |
  awk -F\" '/class="script-link"/{c=split($4,f,"/")
    print$4"/code/"f[c]".user.js" | "xargs -n1 curl -OL"}'
