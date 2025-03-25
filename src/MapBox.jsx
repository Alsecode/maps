import React, { useState, useEffect } from 'react';
import { Map, Marker, Source, Layer } from 'react-map-gl';

const MapComponent = () => {
  const [viewState, setViewState] = useState({
    latitude: 55.3,
    longitude: 38.9,
    zoom: 6
  });

  // Инициализация Mapbox
  useEffect(() => {
    window.mapboxgl.accessToken = 'pk.eyJ1IjoiYWxzZWNvZGUiLCJhIjoiY204b2ZvMXh2MDF2dzJycjEzenV4cTI5MyJ9.sFPeNLEt8fpgnQM2s_kwtQ';
  }, []);

  const coordinates = [
    [37.6, 55.7], // Москва
    [39.7, 54.6],  // Рязань
    [40.40, 56.12], // Владимир
    [37.6, 55.7],
  ];

  const lineData = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  };

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {coordinates.slice(0, -1).map((coord, index) => (
        <Marker key={index} longitude={coord[0]} latitude={coord[1]}>
          <div style={markerStyle} />
        </Marker>
      ))}

      <Source id="route" type="geojson" data={lineData}>
        <Layer
          id="route-line"
          type="line"
          paint={{
            'line-color': '#ff0000',
            'line-width': 3
          }}
        />
      </Source>
    </Map>
  );
};

const markerStyle = {
  width: '15px',
  height: '15px',
  backgroundColor: '#ff0000',
  borderRadius: '50%'
};

export default MapComponent;