#!/bin/bash

# Spec Kit wrapper script for easy usage

if [ $# -eq 0 ]; then
    echo "🚀 Spec Kit Commands"
    echo "===================="
    echo ""
    echo "Available commands:"
    echo "  constitution - Create or update project constitution"
    echo "  specify      - Create a new specification"
    echo "  plan         - Create an implementation plan"
    echo "  tasks        - Generate task lists"
    echo "  analyze      - Analyze project alignment"
    echo "  help         - Show this help message"
    echo ""
    echo "Usage: spec.sh <command>"
    echo "Example: spec.sh constitution"
    exit 0
fi

# Run the spec-kit with the provided command
./spec-kit "$1"