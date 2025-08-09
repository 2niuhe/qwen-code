## Simple Makefile for Bun binary releases

.PHONY: release clean

# Ensure Bun is available on PATH
export PATH := $(HOME)/.bun/bin:$(PATH)
BUN_BIN := $(HOME)/.bun/bin/bun
BUN_VERSION := 1.2.19

release:
	@echo "==> Ensuring Bun ($(BUN_VERSION)) is installed"
	@if [ ! -x "$(BUN_BIN)" ]; then \
		curl -fsSL https://bun.sh/install | bash -s -- bun-v$(BUN_VERSION); \
	fi
	@echo "==> Bun version: $$(bun --version)"
	@echo "==> Ensuring npm dependencies"
	@if [ ! -d node_modules ]; then \
		npm ci; \
	fi
	@echo "==> Building cross-platform binaries via Bun"
	@npm run clean
	@npm run build
	@npm run bundle
	@npm run release:bun

clean:
	@echo "==> Cleaning build artifacts"
	@node scripts/clean.js || true
	@rm -rf release || true
	@echo "Done."
