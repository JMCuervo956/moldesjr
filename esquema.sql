-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: sarlaft
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bloques`
--

DROP TABLE IF EXISTS `bloques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloques` (
  `id_bloque` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  PRIMARY KEY (`id_bloque`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id_item` int NOT NULL AUTO_INCREMENT,
  `func_id` int NOT NULL,
  `func_doc` int NOT NULL,
  `id_bloque` int NOT NULL,
  `ocompra` int NOT NULL,
  `fecha_inspeccion` date NOT NULL,
  `no` varchar(10) NOT NULL,
  `aspecto` varchar(500) NOT NULL,
  `si` char(1) DEFAULT NULL,
  `no_` char(1) DEFAULT NULL,
  `na` char(1) DEFAULT NULL,
  `firma` varchar(100) DEFAULT NULL,
  `observacion` text,
  PRIMARY KEY (`id_item`),
  UNIQUE KEY `func_id` (`func_id`,`func_doc`,`ocompra`,`fecha_inspeccion`,`no`),
  KEY `idx_func_doc` (`func_doc`),
  KEY `idx_ocompra` (`ocompra`),
  KEY `idx_fecha` (`fecha_inspeccion`),
  KEY `idx_doc_fecha_ocompra` (`func_doc`,`fecha_inspeccion`,`ocompra`),
  KEY `idx_fecha_doc` (`fecha_inspeccion`,`func_doc`),
  KEY `id_bloque` (`id_bloque`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`id_bloque`) REFERENCES `bloques` (`id_bloque`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=316 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items_hist`
--

DROP TABLE IF EXISTS `items_hist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items_hist` (
  `id_item` int NOT NULL AUTO_INCREMENT,
  `func_id` int NOT NULL,
  `func_doc` int NOT NULL,
  `id_bloque` int NOT NULL,
  `ocompra` int NOT NULL,
  `fecha_inspeccion` date NOT NULL,
  `no` varchar(10) NOT NULL,
  `aspecto` varchar(500) NOT NULL,
  `si` char(1) DEFAULT NULL,
  `no_` char(1) DEFAULT NULL,
  `na` char(1) DEFAULT NULL,
  `firma` varchar(100) DEFAULT NULL,
  `observacion` text,
  PRIMARY KEY (`id_item`),
  UNIQUE KEY `func_id` (`func_id`,`func_doc`,`ocompra`,`fecha_inspeccion`,`no`),
  KEY `idx_func_doc` (`func_doc`),
  KEY `idx_ocompra` (`ocompra`),
  KEY `idx_fecha` (`fecha_inspeccion`),
  KEY `idx_doc_fecha_ocompra` (`func_doc`,`fecha_inspeccion`,`ocompra`),
  KEY `idx_fecha_doc` (`fecha_inspeccion`,`func_doc`),
  KEY `id_bloque` (`id_bloque`),
  CONSTRAINT `items_hist_ibfk_1` FOREIGN KEY (`id_bloque`) REFERENCES `bloques` (`id_bloque`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=383 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items_hist_log`
--

DROP TABLE IF EXISTS `items_hist_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items_hist_log` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `fecha_ejecucion` datetime NOT NULL,
  `registros_insertados` int NOT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items_log`
--

DROP TABLE IF EXISTS `items_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items_log` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `fecha_ejecucion` datetime NOT NULL,
  `registros_insertados` int NOT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs_mjr`
--

DROP TABLE IF EXISTS `logs_mjr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs_mjr` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `user` varchar(50) NOT NULL,
  `proceso` int NOT NULL,
  `fecha_proceso` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1494 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pgtaresp`
--

DROP TABLE IF EXISTS `pgtaresp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pgtaresp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idprg` int NOT NULL,
  `pregunta` varchar(255) NOT NULL,
  `respuesta` varchar(50) NOT NULL,
  `fecha` datetime DEFAULT NULL,
  `estado` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idprg` (`idprg`),
  CONSTRAINT `pgtaresp_ibfk_1` FOREIGN KEY (`idprg`) REFERENCES `preguntas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `piezas`
--

DROP TABLE IF EXISTS `piezas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `piezas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idpz` int DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `cantidad` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `preguntas`
--

DROP TABLE IF EXISTS `preguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `texto` varchar(255) NOT NULL,
  `estado` int DEFAULT NULL,
  `activo` int DEFAULT NULL,
  `FechaCreacion` datetime DEFAULT NULL,
  `FechaProceso` date DEFAULT NULL,
  `cerrar` int NOT NULL DEFAULT '0',
  `disponer` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `procesos_mjr`
--

DROP TABLE IF EXISTS `procesos_mjr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procesos_mjr` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `proceso` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `respusers`
--

DROP TABLE IF EXISTS `respusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `respusers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` varchar(50) NOT NULL,
  `idprg` int NOT NULL,
  `pregunta` varchar(255) NOT NULL,
  `idpres` int NOT NULL,
  `respuesta` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idpres` (`idpres`),
  CONSTRAINT `respusers_ibfk_1` FOREIGN KEY (`idpres`) REFERENCES `pgtaresp` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_acabados`
--

DROP TABLE IF EXISTS `tbl_acabados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_acabados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idpz` int DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_actividad`
--

DROP TABLE IF EXISTS `tbl_actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_actividad` (
  `idT` int NOT NULL AUTO_INCREMENT,
  `idot` int NOT NULL,
  `id` int DEFAULT NULL,
  `task` int DEFAULT NULL,
  `text` varchar(60) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `progress` decimal(5,2) DEFAULT NULL,
  `type` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`idT`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_ccoestado`
--

DROP TABLE IF EXISTS `tbl_ccoestado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_ccoestado` (
  `codigo` int NOT NULL,
  `descripcion` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_cliente`
--

DROP TABLE IF EXISTS `tbl_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_cliente` (
  `nit` varchar(15) NOT NULL,
  `dv` varchar(3) NOT NULL,
  `cliente` varchar(60) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `celular1` varchar(20) DEFAULT NULL,
  `celular2` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `pais` int DEFAULT NULL,
  `ciudad` int DEFAULT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_ccosto`
--

DROP TABLE IF EXISTS `tbl_ccosto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_ccosto` (
  `idcc` int NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `ocompra` varchar(10) NOT NULL,
  `cliente` varchar(15) NOT NULL,
  `fecha_orden` date DEFAULT NULL,
  `fecha_entrega` date DEFAULT NULL,
  `cantidad` int NOT NULL,
  `unidad` int NOT NULL,
  `peso` int NOT NULL,
  `pais` int NOT NULL,
  `ciudad` int NOT NULL,
  `comentarios` text,
  `estado` int DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  PRIMARY KEY (`idcc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_ciudad`
--

DROP TABLE IF EXISTS `tbl_ciudad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_ciudad` (
  `iso_ciudad` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `pais_codigo` int NOT NULL,
  PRIMARY KEY (`iso_ciudad`),
  KEY `pais_codigo` (`pais_codigo`),
  CONSTRAINT `tbl_ciudad_ibfk_1` FOREIGN KEY (`pais_codigo`) REFERENCES `tbl_paises` (`iso_pais`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_dss`
--

DROP TABLE IF EXISTS `tbl_dss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_dss` (
  `idot` int NOT NULL,
  `identificador` int NOT NULL,
  PRIMARY KEY (`idot`,`identificador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_efuncional`
--

DROP TABLE IF EXISTS `tbl_efuncional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_efuncional` (
  `tipo_id` int NOT NULL,
  `identificador` int NOT NULL,
  `funcionario` varchar(60) NOT NULL,
  `perfil` int NOT NULL,
  `fechaini` varchar(50) DEFAULT NULL,
  `estado` int NOT NULL,
  `fechaest` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`tipo_id`,`identificador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_estados`
--

DROP TABLE IF EXISTS `tbl_estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_estados` (
  `id` int NOT NULL,
  `estado` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_estcco`
--

DROP TABLE IF EXISTS `tbl_estcco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_estcco` (
  `cco_idest` int NOT NULL,
  `cco_descrip` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`cco_idest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_insp_body`
--

DROP TABLE IF EXISTS `tbl_insp_body`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_insp_body` (
  `idot` int NOT NULL,
  `indice` varchar(10) NOT NULL,
  `l_si` varchar(2) DEFAULT NULL,
  `l_no` varchar(2) DEFAULT NULL,
  `l_na` varchar(2) DEFAULT NULL,
  `m_si` varchar(2) DEFAULT NULL,
  `m_no` varchar(2) DEFAULT NULL,
  `m_na` varchar(2) DEFAULT NULL,
  `mi_si` varchar(2) DEFAULT NULL,
  `mi_no` varchar(2) DEFAULT NULL,
  `mi_na` varchar(2) DEFAULT NULL,
  `j_si` varchar(2) DEFAULT NULL,
  `j_no` varchar(2) DEFAULT NULL,
  `j_na` varchar(2) DEFAULT NULL,
  `v_si` varchar(2) DEFAULT NULL,
  `v_no` varchar(2) DEFAULT NULL,
  `v_na` varchar(2) DEFAULT NULL,
  `l` varchar(1) DEFAULT NULL,
  `m` varchar(1) DEFAULT NULL,
  `mi` varchar(1) DEFAULT NULL,
  `j` varchar(1) DEFAULT NULL,
  `v` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`idot`,`indice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_insp_indices`
--

DROP TABLE IF EXISTS `tbl_insp_indices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_insp_indices` (
  `tb_indice` varchar(10) NOT NULL,
  PRIMARY KEY (`tb_indice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_insp_opc`
--

DROP TABLE IF EXISTS `tbl_insp_opc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_insp_opc` (
  `indice` varchar(10) NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `prd` varchar(1) NOT NULL,
  PRIMARY KEY (`indice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_menu`
--

DROP TABLE IF EXISTS `tbl_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_menu` (
  `id_menu` int NOT NULL,
  `opcion` int DEFAULT NULL,
  `menu` varchar(100) NOT NULL,
  PRIMARY KEY (`id_menu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_otrabajo`
--

DROP TABLE IF EXISTS `tbl_otrabajo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_otrabajo` (
  `idot` int NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `proveedor` int NOT NULL,
  `disenador` int DEFAULT NULL,
  `supervisor` int DEFAULT NULL,
  `soldador` int DEFAULT NULL,
  `observacion` text,
  `fecharg` datetime DEFAULT NULL,
  PRIMARY KEY (`idot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_paises`
--

DROP TABLE IF EXISTS `tbl_paises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_paises` (
  `iso_pais` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `iso_alpha2` char(2) NOT NULL,
  `iso_alpha3` char(3) NOT NULL,
  PRIMARY KEY (`iso_pais`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_perfil`
--

DROP TABLE IF EXISTS `tbl_perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_perfil` (
  `id` int NOT NULL,
  `perfil` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_piezas`
--

DROP TABLE IF EXISTS `tbl_piezas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_piezas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idpz` int DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `cantidad` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_poderes_usu`
--

DROP TABLE IF EXISTS `tbl_poderes_usu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_poderes_usu` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `numprop` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `propoder` int NOT NULL,
  `proname` varchar(50) NOT NULL,
  `pdf` varchar(50) DEFAULT NULL,
  `ruta` varchar(50) DEFAULT NULL,
  `Fecha` date DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_prgcco`
--

DROP TABLE IF EXISTS `tbl_prgcco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_prgcco` (
  `cco_idprg` int NOT NULL,
  `cco_descrip` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`cco_idprg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_propiedad`
--

DROP TABLE IF EXISTS `tbl_propiedad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_propiedad` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `id_rz` varchar(50) NOT NULL,
  `razonsocial` varchar(50) NOT NULL,
  `nit` varchar(64) NOT NULL,
  `direccion` varchar(50) NOT NULL,
  `tipo` int NOT NULL,
  `estado` varchar(1) DEFAULT NULL,
  `nomid` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `id_rz` (`id_rz`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_proveedor`
--

DROP TABLE IF EXISTS `tbl_proveedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_proveedor` (
  `nit` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_rol`
--

DROP TABLE IF EXISTS `tbl_rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_rol` (
  `id` int NOT NULL,
  `rol` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_tipodoc`
--

DROP TABLE IF EXISTS `tbl_tipodoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_tipodoc` (
  `id` int NOT NULL,
  `tipodoc` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_unidad`
--

DROP TABLE IF EXISTS `tbl_unidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_unidad` (
  `id_unidad` int NOT NULL,
  `unidad` varchar(50) NOT NULL,
  PRIMARY KEY (`id_unidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `user` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `pass` varchar(100) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `estado` varchar(1) DEFAULT NULL,
  `fecha_nac` date DEFAULT NULL,
  `fecha_cre` date DEFAULT NULL,
  `fecha_act` date DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_add`
--

DROP TABLE IF EXISTS `users_add`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_add` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_code` varchar(50) NOT NULL,
  `module` varchar(100) NOT NULL,
  `opcion` varchar(100) DEFAULT NULL,
  `can_view` tinyint DEFAULT '0',
  `can_create` tinyint DEFAULT '0',
  `can_edit` tinyint DEFAULT '0',
  `can_delete` tinyint DEFAULT '0',
  `activo` tinyint DEFAULT '1',
  `fecha_cre` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_act` date DEFAULT NULL,
  `asignado_por` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_code` (`user_code`),
  KEY `asignado_por` (`asignado_por`),
  CONSTRAINT `users_add_ibfk_1` FOREIGN KEY (`user_code`) REFERENCES `users` (`user`) ON DELETE CASCADE,
  CONSTRAINT `users_add_ibfk_2` FOREIGN KEY (`asignado_por`) REFERENCES `users` (`user`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_asmb`
--

DROP TABLE IF EXISTS `users_asmb`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_asmb` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `rz` varchar(50) NOT NULL,
  `id_rz` varchar(50) NOT NULL,
  `user` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `numprop` int DEFAULT NULL,
  `areaprop` double DEFAULT NULL,
  `areaparq` double DEFAULT NULL,
  `total` double DEFAULT NULL,
  `coeficiente` double DEFAULT NULL,
  `poderes` int DEFAULT NULL,
  `rol` varchar(50) NOT NULL,
  `estado` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-26 15:05:49
