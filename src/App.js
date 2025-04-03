import React, { useState, useCallback } from 'react';
import {
  Box, TextField, Button, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Container, Stack, Divider, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MapOSM from './MapOSM';

function App() {
  const [routes, setRoutes] = useState([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newLat, setNewLat] = useState('');

  // Мемоизация создания маршрута
  const handleAddRoute = useCallback(() => {
    const routeColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const newRoute = {
      // Текущая длина для нумерации
      name: `Маршрут #${routes.length + 1}`,
      color: routeColor,
      coordinates: [],
    };
    setRoutes(prevRoutes => [...prevRoutes, newRoute]);
    setCurrentRouteIndex(routes.length); // Индекс нового маршрута = текущая длина
  }, [routes.length]); // Зависимость от длины, чтобы имя было корректным

  // Добавление координаты
  const handleAddCoordinate = useCallback(() => {
    if (currentRouteIndex === '' || currentRouteIndex < 0) return;
    const lng = parseFloat(newLng);
    const lat = parseFloat(newLat);

    if (!isNaN(lng) && !isNaN(lat)) {
      setRoutes(prevRoutes => {
        const updatedRoutes = [...prevRoutes];
        if (updatedRoutes[currentRouteIndex]) {
            updatedRoutes[currentRouteIndex] = {
                ...updatedRoutes[currentRouteIndex],
                coordinates: [...updatedRoutes[currentRouteIndex].coordinates, [lng, lat]]
            };
        }
        return updatedRoutes;
      });
      setNewLng('');
      setNewLat('');
    }
  }, [currentRouteIndex, newLng, newLat]);

  // Обработчик клика по карте
  const handleMapClick = useCallback((lng, lat) => {
    // Добавление точки только если выбран маршрут
    if (currentRouteIndex !== '' && currentRouteIndex >= 0) {
        setRoutes(prevRoutes => {
            const updatedRoutes = [...prevRoutes];
            if (updatedRoutes[currentRouteIndex]) {
                updatedRoutes[currentRouteIndex] = {
                    ...updatedRoutes[currentRouteIndex],
                    coordinates: [...updatedRoutes[currentRouteIndex].coordinates, [lng, lat]]
                };
            }
            return updatedRoutes;
        });
    }
  }, [currentRouteIndex]);

  // Обработчик удаления маршрута
  const handleDeleteRoute = useCallback(() => {
    if (currentRouteIndex === '' || currentRouteIndex < 0 || !routes[currentRouteIndex]) return;

    if (window.confirm(`Вы уверены, что хотите удалить "${routes[currentRouteIndex]?.name}"?`)) {
        setRoutes(prevRoutes => prevRoutes.filter((_, index) => index !== currentRouteIndex));
        setCurrentRouteIndex('');
    }
  }, [currentRouteIndex, routes]); // Зависимость от индекса и самих routes (для имени в confirm)

  const handleDeletePoint = useCallback((routeIndex, pointIndex) => {
    setRoutes(prevRoutes => {
        const updatedRoutes = [...prevRoutes];
        if (updatedRoutes[routeIndex]?.coordinates[pointIndex]) {
             const newCoordinates = updatedRoutes[routeIndex].coordinates.filter((_, idx) => idx !== pointIndex);
             updatedRoutes[routeIndex] = {
                 ...updatedRoutes[routeIndex],
                 coordinates: newCoordinates
             };
             // Если в маршруте не осталось точек после удаления, можно его тоже удалить
             // if (newCoordinates.length === 0) {
             //     updatedRoutes.splice(routeIndex, 1);
             //     // Нужно будет обновить currentRouteIndex, если удалили текущий
             //     if (currentRouteIndex === routeIndex) {
             //        setCurrentRouteIndex('');
             //     } else if (currentRouteIndex > routeIndex) {
             //        // Сдвигаем индекс, если удалили маршрут перед текущим
             //        setCurrentRouteIndex(prev => (prev !== '' ? prev -1 : ''));
             //     }
             // }
        }
        return updatedRoutes;
    });
     // При удалении точки может измениться порядок индексов точек, но сам выбранный маршрут остается
  }, []);

  const isAddCoordDisabled = currentRouteIndex === '' || currentRouteIndex < 0;
  const isDeleteRouteDisabled = currentRouteIndex === '' || currentRouteIndex < 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Управление маршрутами
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
        >
            <Button
                variant="contained"
                onClick={handleAddRoute}
                sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
                size="medium"
            >
                Добавить новый маршрут
            </Button>

            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ width: '100%' }}
            >
                <FormControl fullWidth size="small">
                    <InputLabel id="route-select-label">Выберите маршрут</InputLabel>
                    <Select
                        labelId="route-select-label"
                        value={currentRouteIndex}
                        label="Выберите маршрут"
                        onChange={(e) => setCurrentRouteIndex(e.target.value)}
                    >
                    <MenuItem value="" disabled>
                        -- Выберите маршрут --
                    </MenuItem>
                    {routes.map((route, index) => (
                        <MenuItem key={index} value={index}>
                        {route.name} (точек: {route.coordinates.length})
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>

                <IconButton
                    aria-label="Удалить выбранный маршрут"
                    color="error"
                    onClick={handleDeleteRoute}
                    disabled={isDeleteRouteDisabled}
                    sx={{ flexShrink: 0 }}
                    title={isDeleteRouteDisabled ? "Сначала выберите маршрут" : "Удалить выбранный маршрут"}
                >
                    <DeleteIcon />
                </IconButton>
            </Stack>
        </Stack>

        {routes.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" component="h2">
              Добавить точку в маршрут "{routes[currentRouteIndex]?.name || ' (выберите маршрут)'}"
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'flex-end' }}
            >
              <TextField label="Долгота (lng)" value={newLng} onChange={(e) => setNewLng(e.target.value)} type="number" fullWidth disabled={isAddCoordDisabled} size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Широта (lat)" value={newLat} onChange={(e) => setNewLat(e.target.value)} type="number" fullWidth disabled={isAddCoordDisabled} size="small" InputLabelProps={{ shrink: true }} />
              <Button variant="contained" onClick={handleAddCoordinate} disabled={isAddCoordDisabled || !newLng || !newLat} sx={{ flexShrink: 0 }} size="small">
                Добавить точку
              </Button>
            </Stack>
            <Typography variant="body2" color="textSecondary">
              Кликните на карту, чтобы добавить точку в выбранный маршрут.
              Кликните на существующую точку, чтобы увидеть опцию удаления.
            </Typography>
          </>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ height: '60vh', minHeight: '400px', width: '100%' }}>
          <MapOSM
            routes={routes}
            onMapClick={handleMapClick}
            selectedRouteIndex={currentRouteIndex}
            onPointDelete={handleDeletePoint}
          />
        </Box>
      </Stack>
    </Container>
  );
}

export default App;