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

      if [ $# -lt 6 ] || [ $# -gt 10 ]; then
        echo "Usage: build <git_repo> <branch> <install_command> <build_command> <dist_folder> <project_root> [subdirectory] [protocol_land] [wallet_address] [repo_name]"
        return 1
      fi

      GIT_REPO="$1"
      BRANCH="$2"
      INSTALL_COMMAND="$3"
      BUILD_COMMAND="$4"
      DIST_FOLDER="$5"
      PROJECT_ROOT="$6"
      SUBDIRECTORY="''${7:-}"
      PROTOCOL_LAND="''${8:-false}"
      WALLET_ADDRESS="''${9:-}"
      REPO_NAME="''${10:-}"

      if ! validate_command "$INSTALL_COMMAND" || ! validate_command "$BUILD_COMMAND"; then
        echo "Error: Invalid command detected."
        return 1
      fi

      if [ "$PROTOCOL_LAND" = "true" ]; then
        if [ -z "$WALLET_ADDRESS" ] || [ -z "$REPO_NAME" ]; then
          echo "Error: Wallet address and repo name are required for Protocol Land repositories."
          return 1
        fi
        OWNER_NAME="$WALLET_ADDRESS"
      else
        REPO_NAME=$(basename "$GIT_REPO" .git)
        OWNER_NAME=$(basename "$(dirname "$GIT_REPO")")
      fi

      BUILD_DIR="$PROJECT_ROOT/builds/$OWNER_NAME/$REPO_NAME"
      LOG_FILE="$BUILD_DIR/build.log"
      ROOT_DIR="$/tmp/arlink"
      TMP_DIR="$ROOT_DIR/tmp_''${OWNER_NAME}_''${REPO_NAME}"
      
      if [ -n "$TMP_DIR" ]; then
        rm -rf "$TMP_DIR"
      fi
      
      if [ -n "$ROOT_DIR" ]; then
        mkdir -p "$ROOT_DIR"
      fi

      mkdir -p "$BUILD_DIR"
      
      mkdir -p "$TMP_DIR"
      
      {
        echo "Build started at $(date)"
        echo "Repository: $GIT_REPO (Branch: $BRANCH)"
        echo "Build Directory: $BUILD_DIR"

        echo "Cloning repository..."
        if [ "$PROTOCOL_LAND" = "true" ]; then
          # Install Protocol Land helper locally
          npm install --prefix "$TMP_DIR" @protocol.land/git-remote-helper
          export PATH="$TMP_DIR/node_modules/.bin:$PATH"
          git clone -q "$GIT_REPO" -b "$BRANCH" "$TMP_DIR/repo"
        elif [[ "$GIT_REPO" == *"x-access-token:"* ]]; then
          GIT_ASKPASS=echo git clone -q "$GIT_REPO" -b "$BRANCH" "$TMP_DIR/repo"
        else
          git clone -q "$GIT_REPO" -b "$BRANCH" "$TMP_DIR/repo"
        fi
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
          rm -rf "$BUILD_DIR/output"
          mkdir -p "$BUILD_DIR/output"
          cp -r "$DIST_FOLDER"/* "$BUILD_DIR/output/"
          echo "Build artifacts copied to $BUILD_DIR/output/"
        else
          echo "Warning: $DIST_FOLDER not found. No artifacts copied."
        fi

        echo "Cleaning up temporary directory..."
        cd "$PROJECT_ROOT"
        rm -rf "$TMP_DIR"

        echo "Build completed at $(date)"
      
      } 2>&1 | tee "$LOG_FILE"

      echo "Build finished. Log file: $LOG_FILE"
      echo "Build output: $BUILD_DIR/output"
    }

    export -f build validate_command
  '';
}