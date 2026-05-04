# ~/.profile: executed by Bourne-compatible login shells.

if [ "$BASH" ]; then
  if [ -f ~/.bashrc ]; then
    . ~/.bashrc
  fi
fi

# Created by `pipx` on 2026-02-04 18:32:56
export PATH="$PATH:/root/.local/bin"
