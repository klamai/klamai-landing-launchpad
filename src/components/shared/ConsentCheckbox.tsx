import { Controller, Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface ConsentCheckboxProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  error?: string;
}

export function ConsentCheckbox({ control, name, error }: ConsentCheckboxProps) {
  return (
    <div className="items-top flex space-x-2">
      <Controller
        name={name}
        control={control}
        rules={{ required: 'Debes aceptar los términos y condiciones' }}
        render={({ field }) => (
          <Checkbox
            id={name}
            checked={field.value}
            onCheckedChange={field.onChange}
            className="mt-1"
          />
        )}
      />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor={name} className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
          Acepto el{' '}
          <Link to="/aviso-legal" target="_blank" className="font-semibold underline text-primary">
            Aviso Legal
          </Link>{' '}
          y la{' '}
          <Link to="/politicas-privacidad" target="_blank" className="font-semibold underline text-primary">
            Política de Privacidad
          </Link>
          .
        </Label>
        <p className="text-sm text-muted-foreground">
          Al aceptar, confirmas que has leído y estás de acuerdo con nuestras políticas.
        </p>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>
    </div>
  );
}
