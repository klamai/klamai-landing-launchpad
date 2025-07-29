-- Trigger y función para notificar al cliente de una nueva nota de su abogado
create or replace function notify_cliente_nueva_nota()
returns trigger as $$
declare
  cliente_id uuid;
begin
  -- Solo notificar si la nota es para el cliente o ambos y la escribe un abogado
  if (new.destinatario = 'cliente' or new.destinatario = 'ambos') and new.autor_rol = 'abogado' then
    select casos.cliente_id into cliente_id from casos where casos.id = new.caso_id;
    if cliente_id is not null then
      insert into notificaciones (usuario_id, mensaje, leida, url_destino, created_at)
      values (
        cliente_id,
        'Tienes una nueva nota de tu abogado en el caso #' || new.caso_id,
        false,
        '/dashboard/casos/' || new.caso_id,
        now()
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_notify_cliente_nueva_nota on notas_caso;
create trigger trigger_notify_cliente_nueva_nota
after insert on notas_caso
for each row execute function notify_cliente_nueva_nota(); 