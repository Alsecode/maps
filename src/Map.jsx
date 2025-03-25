import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Map() {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=JcFcsqFGijewR6d0lWDU',
      center: [37.6, 55.7], // Москва
      zoom: 10
    });

    // Метки
    new maplibregl.Marker({ color: '#FF0000' })
      .setLngLat([37.6, 55.7])
      .setPopup(new maplibregl.Popup().setText('Москва'))
      .addTo(map);

    new maplibregl.Marker({ color: '#FF0000' })
      .setLngLat([39.7, 54.6])
      .setPopup(new maplibregl.Popup().setText('Рязань'))
      .addTo(map);

    new maplibregl.Marker({ color: '#FF0000' })
      .setLngLat([40.40, 56.12])
      .setPopup(new maplibregl.Popup().setText('Владимир'))
      .addTo(map);

    // Линия между точками
    map.on('load', () => {
      map.addLayer({
        id: 'line',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [37.6, 55.7], // Москва
                [39.7, 54.6],  // Рязань
                [40.40, 56.12], // Владимир
                [37.6, 55.7],
              ]
            }
          }
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3
        }
      });
    });

    return () => map.remove();
  }, []);

  return <div ref={mapRef} style={{ height: '500px', width: '100%' }} />;
}