# 7.6 Fotos

- **Fluxo:** envio → o servidor lê o EXIF (data e GPS) só para sugerir data e lugar e marcar “visita verificada” → remove todos os metadados recodificando a imagem em WebP → gera a miniatura → salva.
- **O original com EXIF nunca é armazenado.** A remoção vale para todas as fotos, em qualquer momento do envio.
- **Limites (parâmetros):** até 3 fotos por visita, até 10 MB cada no envio.
- **Texto alternativo** opcional em cada foto (acessibilidade).
- **Ferramentas:** `sharp` (Node), que remove os metadados por padrão ao recodificar, ou `Pillow` (Python).


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](../README.md).
