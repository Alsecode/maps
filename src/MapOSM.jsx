import React, { useEffect, useRef, memo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mui/material';

// Стили для кнопки удаления
const popupDeleteButtonStyle = `
  .maplibregl-popup-delete-button {
    background-color:rgb(230, 74, 74); /* Красный цвет */
    color: white;
    border: none;
    padding: 5px 10px;
    margin-top: 8px; /* Отступ сверху */
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    transition: background-color 0.2s ease;
    display: block; /* Чтобы занимала всю ширину попапа */
    width: 100%;
    box-sizing: border-box; /* Учитываем padding в ширине */
  }
  .maplibregl-popup-delete-button:hover {
    background-color: #d32f2f; /* Более темный красный при наведении */
  }
  /* Можно добавить стили для самого попапа, если нужно */
  .maplibregl-popup-content {
      font-family: inherit; /* Наследуем шрифт приложения */
      max-width: 250px !important; /* Ограничим ширину */
      padding: 10px 10px 5px; /* Уменьшим паддинг снизу */
  }
`;

const MapOSM = memo(({ routes, onMapClick, selectedRouteIndex, onPointDelete }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const prevPropsRef = useRef({ routes: [], selectedRouteIndex: '' });
  const managedLayersRef = useRef(new Set());
  const managedSourcesRef = useRef(new Set());
  const currentPopupRef = useRef(null);

  useEffect(() => {
      const styleElement = document.createElement('style');
      styleElement.id = 'maplibre-popup-styles';
      styleElement.innerHTML = popupDeleteButtonStyle;
      document.head.appendChild(styleElement);

      return () => {
          const existingStyleElement = document.getElementById('maplibre-popup-styles');
          if (existingStyleElement) {
              document.head.removeChild(existingStyleElement);
          }
      };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
     const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=JcFcsqFGijewR6d0lWDU',
      center: [37.6173, 55.7558],
      zoom: 9,
      fadeDuration: 0,
    });

    mapInstanceRef.current = map;

    // Обработчик клика по карте
    const handleMapInteraction = (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: Array.from(managedLayersRef.current).filter(id => id.endsWith('-points'))
        });
        if (!features.length) {
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;
            const { lng, lat } = e.lngLat;
            onMapClick(parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6)));
        }
    };
    map.on('click', handleMapInteraction);

    // Глобальный обработчик для кнопки удаления в попапе
    const handleDeleteButtonClick = (event) => {
        const target = event.target;
        if (target.classList.contains('maplibregl-popup-delete-button')) {
            const routeIndex = parseInt(target.dataset.routeIndex, 10);
            const pointIndex = parseInt(target.dataset.pointIndex, 10);
            if (!isNaN(routeIndex) && !isNaN(pointIndex) && onPointDelete) {
                onPointDelete(routeIndex, pointIndex);
                currentPopupRef.current?.remove();
                currentPopupRef.current = null;
            }
        }
    };
     // вешаем на mapContainerRef.current, если он уже есть
     if (mapContainerRef.current) {
        mapContainerRef.current.addEventListener('click', handleDeleteButtonClick);
     }


    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.FullscreenControl());

    return () => {
      map.off('click', handleMapInteraction);
      if (mapContainerRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          mapContainerRef.current.removeEventListener('click', handleDeleteButtonClick);
      }
      currentPopupRef.current?.remove();
      map.remove();
      mapInstanceRef.current = null;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      managedLayersRef.current.clear();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      managedSourcesRef.current.clear();
    };
  }, [onMapClick, onPointDelete]);


  // Вспомогательная функция для добавления обработчиков (обернута в useCallback)
  const addPointEventHandlers = useCallback((map, layerId, pointDeleteCallback) => {
        // Клик по точке - открывает попап
        const handlePointClick = (e) => {
            e.originalEvent.stopPropagation();
            currentPopupRef.current?.remove();

            const feature = e.features[0];
            if (!feature) return;

            const coordinates = feature.geometry.coordinates.slice();
            const props = feature.properties;

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            const popupContent = `
                <div>
                    <strong>${props.title}</strong><br>
                    ${props.description}<br>
                    <small>Lng: ${coordinates[0].toFixed(4)}, Lat: ${coordinates[1].toFixed(4)}</small>
                    ${pointDeleteCallback ?
                    `<button class="maplibregl-popup-delete-button"
                             data-route-index="${props.routeIndex}"
                             data-point-index="${props.pointIndex}">
                        Удалить эту точку
                    </button>` : ''}
                </div>`;

            currentPopupRef.current = new maplibregl.Popup({ closeOnClick: false, closeButton: true, maxWidth: 'none' }) // maxWidth: 'none' чтобы CSS работал
                .setLngLat(coordinates)
                .setHTML(popupContent)
                .addTo(map);
        };

        const handleMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
        const handleMouseLeave = () => map.getCanvas().style.cursor = '';

        // Удаление старых обработчиков перед добавлением новых
        map.off('click', layerId, handlePointClick);
        map.off('mouseenter', layerId, handleMouseEnter);
        map.off('mouseleave', layerId, handleMouseLeave);

        // Добавление новых
        map.on('click', layerId, handlePointClick);
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);

        // Возвращение функций для возможного использования в cleanup
        return { handlePointClick, handleMouseEnter, handleMouseLeave };

  }, []);


  // Хук для обновления карты
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const runUpdate = () => {
         if (!map.isStyleLoaded()) {
             console.warn("Стили для карты не загрузились");
             map.once('load', runUpdate);
             return;
         }
         // Вызов обновленную функцию отрисовки/обновления
         drawOptimizedRoutes(map, routes, selectedRouteIndex, prevPropsRef.current.routes, addPointEventHandlers, onPointDelete);
         // Сохранение текущих пропсов для следующего сравнения после успешного обновления
         prevPropsRef.current = { routes, selectedRouteIndex };
    }

    // Запуск обновления
    runUpdate();

  // Зависим от данных и колбэков, которые влияют на отрисовку
  }, [routes, selectedRouteIndex, onPointDelete, addPointEventHandlers]);


  // Функция отрисовки/обновления
  const drawOptimizedRoutes = (map, currentRoutes, currentSelection, prevRoutes, attachHandlers, pointDeleteCallback) => {

    const routesToRemove = prevRoutes.filter((_, index) => !currentRoutes[index]);
    const routesToUpdate = currentRoutes;

    // Удаление старых маршрутов
    routesToRemove.forEach((_, index) => {
        // Ищем индекс в prevRoutes, т.к. в currentRoutes его уже нет
        const originalIndex = prevRoutes.findIndex((r, i) => !currentRoutes[i] && i === index);
        if (originalIndex === -1) return;

        const routeId = `route-${originalIndex}`;
        const lineLayerId = `${routeId}-line`;
        const pointsLayerId = `${routeId}-points`;

        // Удаление слоев
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(pointsLayerId)) map.removeLayer(pointsLayerId);
        // Удаление источника
        if (map.getSource(routeId)) map.removeSource(routeId);

        managedLayersRef.current.delete(lineLayerId);
        managedLayersRef.current.delete(pointsLayerId);
        managedSourcesRef.current.delete(routeId);
    });

    // Добавление / Обновление текущих маршрутов
    routesToUpdate.forEach((route, index) => {
      const routeId = `route-${index}`;
      const lineLayerId = `${routeId}-line`;
      const pointsLayerId = `${routeId}-points`;
      let source = map.getSource(routeId);

      // Создание GeoJSON
      const geojsonData = {
          type: 'FeatureCollection',
          features: [
              ...(route.coordinates.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.coordinates } }] : []),
              ...route.coordinates.map((coord, pointIdx) => ({
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: coord },
                  properties: { title: route.name, description: `Точка #${pointIdx + 1}`, routeIndex: index, pointIndex: pointIdx }
              }))
          ]
      };

      // Управление источником
      if (!source) {
          // Источника нет - создаем
          map.addSource(routeId, { type: 'geojson', data: geojsonData });
          managedSourcesRef.current.add(routeId);
          // Обновляем ссылку
          source = map.getSource(routeId);
      } else {
          // Источник есть - обновляем данные
          source.setData(geojsonData);
      }

      // Управление слоем линии
      const lineLayerExists = map.getLayer(lineLayerId);
      if (route.coordinates.length > 1 && !lineLayerExists) {
          // Добавление слоя линии
          map.addLayer({
              id: lineLayerId, type: 'line', source: routeId, filter: ['==', '$type', 'LineString'],
              layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: {}
          });
          managedLayersRef.current.add(lineLayerId);
           console.log(`Added layer: ${lineLayerId}`);
      } else if (route.coordinates.length <= 1 && lineLayerExists) {
          // Удаление слоя линии
          map.removeLayer(lineLayerId);
          managedLayersRef.current.delete(lineLayerId);
           console.log(`Removed layer: ${lineLayerId}`);
      }

      // Управление слоем точек
      const pointsLayerExists = map.getLayer(pointsLayerId);
      if (!pointsLayerExists) {
          // Добавление слоя точек
          map.addLayer({
              id: pointsLayerId, type: 'circle', source: routeId, filter: ['==', '$type', 'Point'],
              paint: {}
          });
          managedLayersRef.current.add(pointsLayerId);
           // Сразу добавляем обработчики
           attachHandlers(map, pointsLayerId, pointDeleteCallback);
      } else {
           attachHandlers(map, pointsLayerId, pointDeleteCallback);
      }

      // Обновление стилей
      const isSelected = index === currentSelection;
      const lineColor = route.color || '#FF0000';
      const lineWidth = isSelected ? 5 : 3;
      const pointRadius = isSelected ? 7 : 5;
      const opacity = isSelected ? 1 : 0.8;

      // Обновление стиля линии (только если слой существует)
      if (map.getLayer(lineLayerId)) {
          map.setPaintProperty(lineLayerId, 'line-color', lineColor);
          map.setPaintProperty(lineLayerId, 'line-width', lineWidth);
          map.setPaintProperty(lineLayerId, 'line-opacity', opacity);
      }
      // Обновление стиля точек (только если слой существует)
      if (map.getLayer(pointsLayerId)) {
          map.setPaintProperty(pointsLayerId, 'circle-color', lineColor);
          map.setPaintProperty(pointsLayerId, 'circle-radius', pointRadius);
          map.setPaintProperty(pointsLayerId, 'circle-opacity', opacity);
          map.setPaintProperty(pointsLayerId, 'circle-stroke-width', isSelected ? 2 : 1);
          map.setPaintProperty(pointsLayerId, 'circle-stroke-color', '#ffffff');
      }
    });
  };

  return (
    <Box
      ref={mapContainerRef}
      sx={{ height: '100%', width: '100%', borderRadius: 'inherit', overflow: 'hidden' }}
    />
  );
});

export default MapOSM;