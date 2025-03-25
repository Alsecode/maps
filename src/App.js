import logo from './logo.svg';
import './App.css';
import { YMaps, Map, Placemark, Polyline } from "@pbe/react-yandex-maps";
import MapOSM from './Map';

const App = () => {
  const points = [
    { lat: 55.7, lng: 37.6 }, // Москва
    { lat: 54.6, lng: 39.7 }, // Рязань
    { lat: 56.12, lng: 40.40 }, // Владимир
    { lat: 55.7, lng: 37.6 },
  ]

  return (
    <div>
      <YMaps query={{ apikey: "API_КЛЮЧ" }} style={{margin: "20px", maxWidth: "100%"}}>
        <Map
          defaultState={{ center: [55.751574, 37.573856], zoom: 5 }}
          width="100%"
          height="400px"
        >
          {/* Маркеры */}
          {points.map((point, idx) => (
            <Placemark key={idx} geometry={[point.lat, point.lng]} />
          ))}

          {/* Линия между точками */}
          <Polyline
            geometry={points.map((p) => [p.lat, p.lng])}
            options={{
              strokeColor: "#0000ff",
              strokeWidth: 4,
            }}
          />
        </Map>
      </YMaps>

      <div style={{margin: "20px"}}> 
        <MapOSM />
      </div>

    </div>
  );
};

export default App;
