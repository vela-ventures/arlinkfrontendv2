{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    git
    nodejs
    nodePackages.npm
    nodePackages.yarn
    nodePackages.pnpm
    deno
    bun
  ];

  shellHook = ''
    validate_command() {
      local command="$1"
      local valid_prefixes=("npm" "pnpm" "yarn" "node" "deno" "bun" "npx" "bunx")
      
      for prefix in "''${valid_prefixes[@]}"; do
        if [[ "$command" == "$prefix"* ]]; then
          return 0
        fi
      done
      
      echo "Invalid command prefix. Allowed prefixes are: ''${valid_prefixes[*]}"
      return 1
    }

    build() {
      set -euo pipefail

      if [ $# -lt 5 ] || [ $# -gt 6 ]; then
        echo "Usage: build <git_repo> <branch> <install_command> <build_command> <dist_folder> [subdirectory]"
        return 1
      fi

      GIT_REPO="$1"
      BRANCH="$2"
      INSTALL_COMMAND="$3"
      BUILD_COMMAND="$4"
      DIST_FOLDER="$5"
      SUBDIRECTORY="''${6:-}"

      if ! validate_command "$INSTALL_COMMAND" || ! validate_command "$BUILD_COMMAND"; then
        echo "Error: Invalid command detected."
        return 1
      fi

      REPO_NAME=$(basename "$GIT_REPO" .git)
      OWNER_NAME=$(basename "$(dirname "$GIT_REPO")")
      BUILD_DIR="$PWD/builds/$OWNER_NAME/$REPO_NAME"
      LOG_FILE="$BUILD_DIR/build.log"
      TMP_DIR=$(mktemp -d -t ci-XXXXXXXXXX)

      mkdir -p "$BUILD_DIR"
      
      {
        echo "Build started at $(date)"
        echo "Repository: $GIT_REPO (Branch: $BRANCH)"
        echo "Build Directory: $BUILD_DIR"

        echo "Cloning repository..."
        GIT_ASKPASS=echo git clone -q "$GIT_REPO" -b "$BRANCH" "$TMP_DIR/repo"
        cd "$TMP_DIR/repo"

        if [ -n "$SUBDIRECTORY" ]; then
          cd "$SUBDIRECTORY" || { echo "Error: Subdirectory $SUBDIRECTORY not found"; exit 1; }
        fi

        echo "Installing dependencies..."
        eval "$INSTALL_COMMAND"

        echo "Building project..."
        eval "$BUILD_COMMAND"

        echo "Copying build artifacts..."
        if [ -d "$DIST_FOLDER" ]; then
          cp -r "$DIST_FOLDER" "$BUILD_DIR/"
          echo "Build artifacts copied to $BUILD_DIR/$(basename "$DIST_FOLDER")"
        else
          echo "Warning: $DIST_FOLDER not found. No artifacts copied."
        fi

        rm -rf "$TMP_DIR"

        echo "Build completed at $(date)"
      } 2>&1 | tee "$LOG_FILE"

      echo "Build finished. Log file: $LOG_FILE"
    }

    if [ $# -ge 5 ] && [ $# -le 6 ]; then
      build "$@"
    else
      echo "Usage: nix-shell build.nix --run 'build <git_repo> <branch> <install_command> <build_command> <dist_folder> [subdirectory]'"
    fi
  '';
}
