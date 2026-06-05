-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 22, 2024 at 12:03 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `ADMIN_ID` varchar(255) NOT NULL,
  `ADMIN_PASSWORD` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`ADMIN_ID`, `ADMIN_PASSWORD`) VALUES
('ADMIN', 'ADMIN');
-- --------------------------------------------------------

--
-- Table structure for table `passport_info`
--

CREATE TABLE `passport_info` (
  `user_id` int(11) NOT NULL,
  `passport_no` varchar(255) NOT NULL,
  `issued_date` date NOT NULL,
  `issued_place` varchar(255) NOT NULL,
  `expiring_date` date NOT NULL,
  `issued_by` varchar(255) NOT NULL,
  `seaman_book_no` varchar(255) NOT NULL,
  `seaman_book_issued_date` date NOT NULL,
  `seaman_book_expiring_date` date NOT NULL,
  `seaman_book_issued_by` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_infor`
--

CREATE TABLE `personal_infor` (
  `user_id` int(11) NOT NULL,
  `dob` date NOT NULL,
  `place_of_birth` varchar(255) NOT NULL,
  `nationality` varchar(255) NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `hair_color` varchar(255) NOT NULL,
  `eye_color` varchar(255) NOT NULL,
  `marital_status` varchar(255) NOT NULL,
  `father_name` varchar(255) NOT NULL,
  `mother_name` varchar(255) NOT NULL,
  `home_address` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `FNAME` varchar(255) NOT NULL,
  `LNAME` varchar(255) NOT NULL,
  `EMAIL` varchar(255) NOT NULL,
  `date_available` date NOT NULL,
  `position_applied` varchar(255) NOT NULL,
  `PHONE_NUMBER` bigint(11) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `GENDER` varchar(255) NOT NULL,
  `cv` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `FNAME`, `LNAME`, `EMAIL`, `date_available`, `position_applied`, `PHONE_NUMBER`, `PASSWORD`, `GENDER`, `cv`) VALUES
('?', '?', '?', '?', '?', '?', '?', '?', '?', '?');

-- New Changes:
-- Add new columns for password reset functionality
ALTER TABLE `users`
ADD COLUMN `account_status` enum('active','inactive','locked') DEFAULT 'active',

-- Add indexes for better performance
ALTER TABLE `users`
ADD INDEX `idx_email` (`EMAIL`),

ALTER TABLE 'users'
ADD INDEX idx_account_status (account_status);
-- --------------------------------------------------------

--
-- Indexes for table `passport_info`
--
ALTER TABLE `passport_info`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `personal_infor`
--
ALTER TABLE `personal_infor`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `passport_info`
--
ALTER TABLE `passport_info`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_infor`
--
ALTER TABLE `personal_infor`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
