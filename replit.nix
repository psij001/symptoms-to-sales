{ pkgs }: {
  deps = [
    pkgs.nodejs_20

    # Browser dependencies for Playwright
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.atk
    pkgs.at-spi2-atk
    pkgs.cups
    pkgs.dbus
    pkgs.expat
    pkgs.libdrm
    pkgs.libxcb
    pkgs.libxkbcommon
    pkgs.pango
    pkgs.cairo
    pkgs.alsa-lib
    pkgs.mesa
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.xorg.libxcb
    pkgs.gtk3
    pkgs.gdk-pixbuf
  ];
}
