# Vídeos do Screensaver

## Status dos Arquivos

✅ **CocaLata.mp4** - 1.29 MB (Funcionando)
❌ **videoscreensave.mp4** - 0 bytes (Arquivo vazio)
❌ **PastelDeCarne.mp4** - 0 bytes (Arquivo vazio)
❌ **PastelDeFrangoComCatupiry.mp4** - 0 bytes (Arquivo vazio)
❌ **PastelDeQueijo.mp4** - 0 bytes (Arquivo vazio)
❌ **PastelDeNutellaComMorango.mp4** - 0 bytes (Arquivo vazio)
❌ **SucoDeLaranja.mp4** - 0 bytes (Arquivo vazio)

## Como Adicionar Vídeos

1. Substitua os arquivos vazios por vídeos reais
2. Formato recomendado: MP4 (H.264)
3. Tamanho recomendado: 720p ou 1080p
4. Duração recomendada: 5-10 segundos por vídeo

## Após adicionar os vídeos

Edite o arquivo `pages/ScreensaverPage.tsx` e atualize a lista `LOCAL_VIDEOS`:

```typescript
const LOCAL_VIDEOS = [
  '/videos/videoscreensave.mp4',
  '/videos/PastelDeCarne.mp4',
  '/videos/PastelDeFrangoComCatupiry.mp4',
  '/videos/PastelDeQueijo.mp4',
  '/videos/PastelDeNutellaComMorango.mp4',
  '/videos/CocaLata.mp4',
  '/videos/SucoDeLaranja.mp4',
];
```

## Problema Atual

Os arquivos de vídeo estão vazios (0 bytes). Isso causa o erro:
```
GET http://localhost:3000/videos/videoscreensave.mp4 416 (Range Not Satisfiable)
```

**Solução:** Substitua os arquivos por vídeos reais com conteúdo.
