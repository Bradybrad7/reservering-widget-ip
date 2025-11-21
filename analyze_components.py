#!/usr/bin/env python3
"""
Component Usage Analyzer
Analyzes which components are actually used in the React TypeScript app
"""

import os
import re
from pathlib import Path
from typing import Set, Dict, List
from collections import defaultdict

# Base directory
BASE_DIR = Path(r"c:\Users\bradl\Desktop\Reservering Widget IP")
SRC_DIR = BASE_DIR / "src"
COMPONENTS_DIR = SRC_DIR / "components"

# Entry points
ENTRY_POINTS = [
    SRC_DIR / "main.tsx",
    SRC_DIR / "admin.tsx",
    SRC_DIR / "App.tsx",
]

def get_all_component_files() -> Set[Path]:
    """Get all .tsx and .ts files in src/components/"""
    component_files = set()
    for ext in ['*.tsx', '*.ts']:
        component_files.update(COMPONENTS_DIR.rglob(ext))
    return component_files

def extract_imports(file_path: Path) -> List[tuple]:
    """Extract import statements from a file"""
    imports = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Match various import patterns
        patterns = [
            # import Component from './Component'
            r"import\s+(\w+)\s+from\s+['\"]([^'\"]+)['\"]",
            # import { Component1, Component2 } from './module'
            r"import\s+\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"]",
            # const Component = lazy(() => import('./Component'))
            r"lazy\(\(\)\s*=>\s*import\(['\"]([^'\"]+)['\"]\)\)",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if len(match) == 2:
                    # Direct import
                    imports.append(match)
                elif len(match) == 1:
                    # Lazy import
                    imports.append(('lazy', match[0]))
        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    
    return imports

def resolve_import_path(from_file: Path, import_path: str) -> Path:
    """Resolve relative import path to absolute file path"""
    # Skip non-relative imports
    if not (import_path.startswith('./') or import_path.startswith('../')):
        # Check if it's from components directory
        if 'components/' in import_path or import_path.startswith('components/'):
            import_path = import_path.replace('components/', './components/')
            from_file = SRC_DIR / "dummy.tsx"
    
    # Remove ./ and ../
    from_dir = from_file.parent
    
    # Handle ../
    while import_path.startswith('../'):
        import_path = import_path[3:]
        from_dir = from_dir.parent
    
    # Handle ./
    if import_path.startswith('./'):
        import_path = import_path[2:]
    
    # Construct full path
    resolved = from_dir / import_path
    
    # Try with different extensions
    for ext in ['', '.tsx', '.ts', '/index.ts', '/index.tsx']:
        candidate = Path(str(resolved) + ext)
        if candidate.exists():
            return candidate
    
    return None

def trace_dependencies(entry_point: Path, visited: Set[Path] = None) -> Set[Path]:
    """Recursively trace all dependencies from an entry point"""
    if visited is None:
        visited = set()
    
    if entry_point in visited or not entry_point.exists():
        return visited
    
    visited.add(entry_point)
    
    # Extract imports
    imports = extract_imports(entry_point)
    
    for _, import_path in imports:
        resolved = resolve_import_path(entry_point, import_path)
        if resolved and resolved not in visited:
            # Only trace within src/ directory
            if str(resolved).startswith(str(SRC_DIR)):
                trace_dependencies(resolved, visited)
    
    return visited

def main():
    print("🔍 Analyzing Component Usage...\n")
    
    # Get all component files
    all_components = get_all_component_files()
    print(f"📁 Total component files found: {len(all_components)}\n")
    
    # Trace from entry points
    used_files = set()
    for entry in ENTRY_POINTS:
        if entry.exists():
            print(f"📌 Tracing from: {entry.name}")
            deps = trace_dependencies(entry)
            used_files.update(deps)
    
    print(f"\n✅ Total files used: {len(used_files)}\n")
    
    # Filter to components only
    used_components = {f for f in used_files if str(f).startswith(str(COMPONENTS_DIR))}
    print(f"✅ Component files used: {len(used_components)}\n")
    
    # Find unused components
    unused_components = all_components - used_components
    
    # Organize by directory
    used_by_dir = defaultdict(list)
    unused_by_dir = defaultdict(list)
    
    for comp in used_components:
        rel_path = comp.relative_to(COMPONENTS_DIR)
        dir_name = str(rel_path.parent) if rel_path.parent != Path('.') else 'root'
        used_by_dir[dir_name].append(rel_path.name)
    
    for comp in unused_components:
        rel_path = comp.relative_to(COMPONENTS_DIR)
        dir_name = str(rel_path.parent) if rel_path.parent != Path('.') else 'root'
        unused_by_dir[dir_name].append(rel_path.name)
    
    # Print results
    print("=" * 80)
    print("📊 RESULTS")
    print("=" * 80)
    
    print(f"\n✅ USED COMPONENTS ({len(used_components)} files):")
    print("-" * 80)
    for dir_name in sorted(used_by_dir.keys()):
        print(f"\n📁 {dir_name}/ ({len(used_by_dir[dir_name])} files)")
        for file in sorted(used_by_dir[dir_name]):
            print(f"   ✓ {file}")
    
    print(f"\n\n❌ UNUSED COMPONENTS ({len(unused_components)} files):")
    print("-" * 80)
    print("⚠️  These files can potentially be DELETED:\n")
    
    for dir_name in sorted(unused_by_dir.keys()):
        print(f"\n📁 {dir_name}/ ({len(unused_by_dir[dir_name])} files)")
        for file in sorted(unused_by_dir[dir_name]):
            full_path = COMPONENTS_DIR / dir_name / file if dir_name != 'root' else COMPONENTS_DIR / file
            print(f"   ✗ {file}")
    
    # Generate deletion commands
    print("\n\n" + "=" * 80)
    print("🗑️  DELETION COMMANDS")
    print("=" * 80)
    print("\nCopy and paste these PowerShell commands to delete unused files:\n")
    
    for comp in sorted(unused_components):
        print(f'Remove-Item "{comp}" -Force')
    
    # Summary
    print(f"\n\n" + "=" * 80)
    print("📈 SUMMARY")
    print("=" * 80)
    print(f"Total components:  {len(all_components)}")
    print(f"Used components:   {len(used_components)} ({len(used_components)/len(all_components)*100:.1f}%)")
    print(f"Unused components: {len(unused_components)} ({len(unused_components)/len(all_components)*100:.1f}%)")

if __name__ == "__main__":
    main()
