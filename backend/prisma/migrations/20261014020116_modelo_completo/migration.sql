-- CreateEnum
CREATE TYPE "CategoriaProducto" AS ENUM ('COMIDA_RAPIDA', 'ALMUERZOS', 'DESAYUNOS', 'POSTRES', 'BEBIDAS', 'SNACKS', 'INGREDIENTES');

-- CreateEnum
CREATE TYPE "EstadoLocal" AS ENUM ('DISPONIBLE', 'SIN_SERVICIO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TRANSFERENCIA', 'QR_NEQUI', 'EFECTIVO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'HECHO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('PEDIDO_NUEVO', 'PEDIDO_HECHO', 'PEDIDO_CANCELADO');

-- CreateTable
CREATE TABLE "codigos_recuperacion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locales" (
    "id" TEXT NOT NULL,
    "propietario_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo_url" TEXT,
    "portada_url" TEXT,
    "eslogan" TEXT,
    "especialidades" "CategoriaProducto"[],
    "estado" "EstadoLocal" NOT NULL DEFAULT 'DISPONIBLE',
    "tiempo_preparacion_min" INTEGER,
    "tiempo_entrega_min" INTEGER,
    "zona_domicilio" TEXT,
    "radio_domicilio_km" DOUBLE PRECISION,
    "precio_domicilio" INTEGER NOT NULL DEFAULT 0,
    "direccion" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "whatsapp" TEXT,
    "redes_sociales" JSONB,
    "metodosPago" "MetodoPago"[],
    "qr_nequi_url" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_local" (
    "id" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "abre_min" INTEGER NOT NULL,
    "cierra_min" INTEGER NOT NULL,

    CONSTRAINT "horarios_local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" "CategoriaProducto" NOT NULL,
    "precio" INTEGER NOT NULL,
    "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_producto" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "comprador_id" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "metodo_pago" "MetodoPago" NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "costo_domicilio" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "direccion_entrega" TEXT NOT NULL,
    "referencias" TEXT,
    "latitud_entrega" DOUBLE PRECISION,
    "longitud_entrega" DOUBLE PRECISION,
    "comprobante_url" TEXT,
    "efectivo_recibido" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendido_en" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "nombre_producto" TEXT NOT NULL,
    "precio_unitario" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "notas" TEXT,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "busquedas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "busquedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "pedido_id" TEXT,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codigos_recuperacion_usuario_id_idx" ON "codigos_recuperacion"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "locales_propietario_id_key" ON "locales"("propietario_id");

-- CreateIndex
CREATE INDEX "horarios_local_local_id_idx" ON "horarios_local"("local_id");

-- CreateIndex
CREATE INDEX "productos_local_id_idx" ON "productos"("local_id");

-- CreateIndex
CREATE INDEX "productos_categoria_idx" ON "productos"("categoria");

-- CreateIndex
CREATE INDEX "imagenes_producto_producto_id_idx" ON "imagenes_producto"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "resenas_producto_id_usuario_id_key" ON "resenas"("producto_id", "usuario_id");

-- CreateIndex
CREATE INDEX "pedidos_comprador_id_idx" ON "pedidos"("comprador_id");

-- CreateIndex
CREATE INDEX "pedidos_local_id_estado_idx" ON "pedidos"("local_id", "estado");

-- CreateIndex
CREATE INDEX "items_pedido_pedido_id_idx" ON "items_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "busquedas_usuario_id_creado_en_idx" ON "busquedas"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_idx" ON "notificaciones"("usuario_id", "leida");

-- AddForeignKey
ALTER TABLE "codigos_recuperacion" ADD CONSTRAINT "codigos_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locales" ADD CONSTRAINT "locales_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_local" ADD CONSTRAINT "horarios_local_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_producto" ADD CONSTRAINT "imagenes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "busquedas" ADD CONSTRAINT "busquedas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
