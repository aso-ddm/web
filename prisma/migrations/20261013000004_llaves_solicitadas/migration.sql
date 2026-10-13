-- Última vez que el socio pidió llaves al secretario (para no repetir el aviso antes de 1 mes)
ALTER TABLE "Usuario" ADD COLUMN "llaves_solicitadas_at" TIMESTAMP(3);
