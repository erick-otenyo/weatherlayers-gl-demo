import maplibregl from "maplibre-gl"
import { MapboxOverlay } from '@deck.gl/mapbox';
import * as WeatherLayers from "weatherlayers-gl";

import "maplibre-gl/dist/maplibre-gl.css"
import "./style.css"


export function waitForDeck(getDeck) {
  return new Promise(resolve => {
    function wait() {
      const deck = getDeck();
      if (deck && deck.getCanvas()) {
        resolve(deck);
      } else {
        setTimeout(wait, 100);
      }
    }
    wait();
  });
}


export function cssToColor(color) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!result) {
    throw new Error('Invalid argument');
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    parseInt(result[4], 16)
  ];
}


window.addEventListener('DOMContentLoaded', async () => {


  // initialize map
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: [0, 0],
    zoom: 2
  });

  // add navigation control
  const nav = new maplibregl.NavigationControl();
  map.addControl(nav, 'top-right');

  // wait for the map to load
  await new Promise(resolve => map.once('style.load', resolve));

  // overlaid deck.gl
  const deckLayer = new MapboxOverlay({
    interleaved: false,
    layers: [],
  });
  map.addControl(deckLayer);

  //  wait for deck.gl to be ready
  const deckgl = window.deckgl = await waitForDeck(() => deckLayer._deck);

  // load data
  const imageUrl = 'http://localhost:5173/data/rainfall/dailyrain2.png';
  const image = await WeatherLayers.loadTextureData(imageUrl);


  const config = {
    image,
    bounds: [32.95, 3.45, 47.95, 14.85],
    imageType: WeatherLayers.ImageType.SCALAR,
    imageUnscale: [0, 54],
    imageInterpolation: WeatherLayers.ImageInterpolation.LINEAR,
  }

  deckgl.setProps({
    layers: [
      new WeatherLayers.RasterLayer({
        id: 'raster',
        ...config,
        // style properties
        palette: [
          [0, [247, 251, 255]],
          [1, [210, 227, 243]],
          [5, [166, 189, 219]],
          [10, [116, 169, 207]],
          [20, [54, 144, 192]],
          [30, [5, 112, 176]],
          [50, [4, 90, 141]],
          [70, [2, 56, 88]],
          [100, [1, 35, 69]],
        ]
      }),
      new WeatherLayers.GridLayer({
        id: 'grid',
        ...config,
        textSize: 12,
        textColor: cssToColor("#000000FF"),
        textOutlineColor: cssToColor("#FFFFFFFF"),
        textOutlineWidth: 2,
      }),
    ],
  });

});