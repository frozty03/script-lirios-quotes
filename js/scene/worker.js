// Prepara a cena fora do fio principal, para a página nunca travar ao toque.

import { prepareScene, sceneTransferables } from './scene.js';

self.onmessage = e => {
  const { id, day, res } = e.data;
  const scene = prepareScene(day, { res });
  self.postMessage({ id, scene }, sceneTransferables(scene));
};
