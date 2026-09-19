import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';

const UPDATE_INTERVAL_MS = 200;
const FACE_DOWN_Z = -0.75;
const LIFTED_Z = -0.45;

export type SensorSnapshot = {
  acceleration: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

export function useDeviceOrientation(enabled = true) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SensorSnapshot>({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  });
  const faceDownReadings = useRef(0);
  const liftedReadings = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let accelerometerSubscription: { remove: () => void } | undefined;
    let gyroscopeSubscription: { remove: () => void } | undefined;

    const subscribe = async () => {
      try {
        const [accelerometerAvailable, gyroscopeAvailable] = await Promise.all([
          Accelerometer.isAvailableAsync(),
          Gyroscope.isAvailableAsync(),
        ]);

        if (!active) return;
        setAvailable(accelerometerAvailable);

        if (!accelerometerAvailable) {
          setError('El acelerómetro no está disponible en este dispositivo.');
          return;
        }

        Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
        accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
          if (!active) return;
          setSnapshot((current) => ({ ...current, acceleration: { x, y, z } }));

          const horizontal = Math.abs(x) < 0.65 && Math.abs(y) < 0.65;
          if (z <= FACE_DOWN_Z && horizontal) {
            faceDownReadings.current += 1;
            liftedReadings.current = 0;
            if (faceDownReadings.current >= 3) setIsFaceDown(true);
          } else if (z >= LIFTED_Z || Math.abs(x) > 0.8 || Math.abs(y) > 0.8) {
            liftedReadings.current += 1;
            faceDownReadings.current = 0;
            if (liftedReadings.current >= 3) setIsFaceDown(false);
          }
        });

        if (gyroscopeAvailable) {
          Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);
          gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
            if (!active) return;
            const movement = Math.sqrt(x * x + y * y + z * z);
            setIsMoving(movement > 0.8);
            setSnapshot((current) => ({ ...current, rotation: { x, y, z } }));
          });
        }
      } catch {
        if (active) {
          setAvailable(false);
          setError('No fue posible iniciar los sensores del teléfono.');
        }
      }
    };

    subscribe();
    return () => {
      active = false;
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
    };
  }, [enabled]);

  return { available, error, isFaceDown, isMoving, snapshot };
}
