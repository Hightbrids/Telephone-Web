-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 13, 2025 at 05:27 PM
-- Server version: 8.0.43-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `it_std6630251261`
--

-- --------------------------------------------------------

--
-- Table structure for table `products_iphone`
--

CREATE TABLE `products_iphone` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products_iphone`
--

INSERT INTO `products_iphone` (`id`, `name`, `price`, `image`) VALUES
(1, 'I phone 12 pro', 20000.00, 'http://nindam.sytes.net/std6630251261/God/images/12pro.jpg'),
(2, 'I phone 13 pro', 24000.00, 'http://nindam.sytes.net/std6630251261/God/images/13pro.jpg'),
(8, 'I phone 15', 48000.00, 'http://nindam.sytes.net/std6630251261/Inventory/uploads/images/1b83e20e-de99-47ce-a500-faac8ecc2317.jpg');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products_iphone`
--
ALTER TABLE `products_iphone`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `products_iphone`
--
ALTER TABLE `products_iphone`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
