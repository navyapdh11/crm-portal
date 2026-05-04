termux-x11 :0 & pulseaudio --start --exit-idle-time=-1 && proot-distro login ubuntu --shared-tmp -- bash -c "export DISPLAY=:0; dbus-launch xfce4-session"
