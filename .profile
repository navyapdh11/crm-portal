
# Kiro CLI pre block. Keep at the top of this file.
[[ -f "${HOME}/.local/share/kiro-cli/shell/profile.pre.bash" ]] && builtin source "${HOME}/.local/share/kiro-cli/shell/profile.pre.bash"

# ~/.profile: executed by Bourne-compatible login shells.

if [ "$BASH" ]; then
  if [ -f ~/.bashrc ]; then
    . ~/.bashrc
  fi
fi

# Created by `pipx` on 2026-02-04 18:32:56
export PATH="$PATH:/root/.local/bin"


# Kiro CLI post block. Keep at the bottom of this file.
[[ -f "${HOME}/.local/share/kiro-cli/shell/profile.post.bash" ]] && builtin source "${HOME}/.local/share/kiro-cli/shell/profile.post.bash"
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
