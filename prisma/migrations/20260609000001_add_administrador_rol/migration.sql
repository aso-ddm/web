-- AlterEnum: Add 'administrador' value to Rol enum
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'administrador';
