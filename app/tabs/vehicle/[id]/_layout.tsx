import { HeaderShownContext } from '@react-navigation/elements';
import { Slot, useRouter } from 'expo-router';
import useTheme from '../../../../Theme/theme';

export default function VehicleLayout() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <HeaderShownContext.Provider value={false}>
      <Slot />
    </HeaderShownContext.Provider>
  );
}