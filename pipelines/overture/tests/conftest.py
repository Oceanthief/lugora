"""Deixa os testes importarem os scripts de pipelines/overture/."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
