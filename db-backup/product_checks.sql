-- phpMyAdmin SQL Dump
-- version 3.3.0
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 23, 2026 at 10:45 AM
-- Server version: 5.5.49
-- PHP Version: 5.4.45-4+deprecated+dontuse+deb.sury.org~precise+1

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `soleinsider`
--

-- --------------------------------------------------------

--
-- Table structure for table `product_checks`
--

CREATE TABLE IF NOT EXISTS `product_checks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `link` text NOT NULL,
  `search_string` text NOT NULL,
  `false_negative` text NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=53 ;

--
-- Dumping data for table `product_checks`
--

INSERT INTO `product_checks` (`id`, `product_id`, `link`, `search_string`, `false_negative`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'http://www.finishline.com/store/product/mens-air-jordan-retro-11-basketball-shoes/_/A-23406?productId=prod708734', 'This product is currently unavailable.', '', 1, '2013-03-17 21:09:01', '0000-00-00 00:00:00'),
(2, 2, 'http://www.finishline.com/store/product/mens-air-jordan-retro-11-basketball-shoes/_/A-638?productId=prod684398', 'This product is currently unavailable.', '', 1, '2013-02-22 16:30:10', '0000-00-00 00:00:00'),
(3, 3, 'http://www.finishline.com/store/product/mens-air-jordan-retro-12-basketball-shoes/_/A-11080?productId=prod694001', 'This product is currently unavailable.', '', 1, '2013-02-22 16:30:18', '0000-00-00 00:00:00'),
(4, 4, 'http://www.finishline.com/store/product/mens-air-jordan-retro-9-basketball-shoes/_/A-11064?productId=prod708585', 'This product is currently unavailable.', '', 1, '2013-02-22 16:30:31', '0000-00-00 00:00:00'),
(5, 19, 'http://www.finishline.com/store/product/mens-air-jordan-retro-5-basketball-shoes/_/A-239?productId=prod712136', 'This product is currently unavailable', '', 1, '2013-03-10 03:02:32', '0000-00-00 00:00:00'),
(6, 20, 'http://www.finishline.com/store/product/mens-air-jordan-retro-9-basketball-shoes/_/A-11620?productId=prod704163', 'This product is currently unavailable', '', 1, '2013-03-10 03:05:03', '0000-00-00 00:00:00'),
(7, 21, 'http://www.finishline.com/store/product/mens-air-jordan-retro-7-basketball-shoes/_/A-25756?productId=prod696925', 'This product is currently unavailable', '', 1, '2013-03-10 03:13:24', '0000-00-00 00:00:00'),
(8, 22, 'http://www.finishline.com/store/product/mens-air-jordan-retro-4-basketball-shoes/_/A-25999?productId=prod708586', 'This product is currently unavailable', '', 1, '2013-03-10 03:15:08', '0000-00-00 00:00:00'),
(9, 23, 'http://www.finishline.com/store/product/mens-air-jordan-retro-13-basketball-shoes/_/A-41214?productId=prod712137', 'This product is currently unavailable', '', 1, '2013-03-10 03:17:39', '0000-00-00 00:00:00'),
(10, 24, 'http://www.finishline.com/store/product/mens-air-jordan-retro-i-basketball-shoes/_/A-5466?productId=prod713189', 'This product is currently unavailable', '', 1, '2013-03-10 14:22:27', '0000-00-00 00:00:00'),
(11, 25, 'http://www.finishline.com/store/product/mens-jordan-spizike-bhm-basketball-shoes/_/A-30906?productId=prod726092', 'This product is currently unavailable', '', 1, '2013-03-10 14:22:27', '0000-00-00 00:00:00'),
(12, 38, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod678090\r\n', 'This product is currently unavailable', '', 1, '2013-03-21 17:37:42', '0000-00-00 00:00:00'),
(13, 39, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod663631', 'This product is currently unavailable.', '', 1, '2013-03-21 17:37:56', '0000-00-00 00:00:00'),
(14, 40, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod649001', 'This product is currently unavailable.', '', 1, '2013-03-21 17:43:30', '0000-00-00 00:00:00'),
(15, 41, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod674223', 'This product is currently unavailable', '', 1, '2013-03-21 17:44:16', '0000-00-00 00:00:00'),
(16, 42, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod653338', 'This product is currently unavailable', '', 1, '2013-03-21 17:46:58', '0000-00-00 00:00:00'),
(17, 43, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod665258', 'This product is currently unavailable', '', 1, '2013-03-21 17:46:49', '0000-00-00 00:00:00'),
(18, 44, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod695345', 'This product is currently unavailable.', '', 1, '2013-03-22 09:22:37', '0000-00-00 00:00:00'),
(19, 45, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod713200', 'This product is currently unavailable.', '', 1, '2013-03-22 09:22:37', '0000-00-00 00:00:00'),
(20, 46, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod678089', 'This product is currently unavailable.', '', 1, '2013-03-22 09:25:06', '0000-00-00 00:00:00'),
(21, 47, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod650234', 'This product is currently unavailable.', '', 1, '2013-03-22 09:25:06', '0000-00-00 00:00:00'),
(23, 72, 'http://www.finishline.com/store/product/mens-air-jordan-retro-3-88-basketball-shoes/_/A-37896?productId=prod726026', 'This product is currently unavailable.', '', 1, '2013-03-29 15:02:32', '0000-00-00 00:00:00'),
(24, 73, 'http://www.finishline.com/store/product/mens-air-jordan-retro-iv-basketball-shoes/_/A-9443?productId=prod723080', 'This product is currently unavailable.', '', 1, '2013-03-29 15:02:32', '0000-00-00 00:00:00'),
(25, 74, 'http://www.finishline.com/store/product/mens-air-jordan-1-retro-high-og-basketball-shoes/_/A-8926?productId=prod715327', 'This product is currently unavailable.', '', 1, '2013-03-29 15:02:55', '0000-00-00 00:00:00'),
(26, 75, 'http://www.finishline.com/store/product/mens-air-jordan-retro-3-basketball-shoes/_/A-1052?productId=prod723188', 'This product is currently unavailable.', '', 1, '2013-03-29 15:03:21', '0000-00-00 00:00:00'),
(27, 95, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod730302', 'This product is currently unavailable.', '', 1, '2013-04-11 10:52:56', '0000-00-00 00:00:00'),
(28, 94, 'http://www.finishline.com/store/product/mens-air-jordan-xx8-basketball-shoes/_/A-34479?productId=prod730301\r\n', 'This product is currently unavailable.', '', 1, '2013-04-11 10:52:56', '0000-00-00 00:00:00'),
(29, 230, 'http://www.finishline.com/store/product/mens-air-jordan-8-retro-basketball-shoes/_/A-3336?productId=prod614003', 'This product is currently unavailable.', '', 1, '2013-07-01 09:13:03', '0000-00-00 00:00:00'),
(30, 296, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod720301', 'This product is currently unavailable', '', 1, '2013-08-18 18:32:47', '0000-00-00 00:00:00'),
(31, 297, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod721301', 'This product is currently unavailable', '', 1, '2013-08-18 18:35:26', '0000-00-00 00:00:00'),
(32, 298, 'http://www.finishline.com/store/product/mens-air-jordan-8-retro-basketball-shoes/_/A-47956?categoryId=cat20083&productId=prod720534', 'This product is currently unavailable.', '', 1, '2013-08-18 18:36:24', '0000-00-00 00:00:00'),
(34, 319, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod725052', 'This product is currently unavailable', '', 1, '2013-08-29 09:10:37', '0000-00-00 00:00:00'),
(35, 357, 'http://www.finishline.com/store/product/mens-air-jordan-retro-iv-basketball-shoes/_/A-4223?productId=prod725053', 'This product is currently unavailable.', '', 1, '2013-09-27 15:56:11', '0000-00-00 00:00:00'),
(36, 560, 'http://www.finishline.com/store/catalog/product.jsp?productId=prod733017&CMP=DSP-Criteo', 'This product is currently unavailable.', '', 1, '2014-01-24 16:54:11', '0000-00-00 00:00:00'),
(37, 699, 'http://www.finishline.com/store/product/mens-air-jordan-retro-6-basketball-shoes/_/A-1567?categoryId=cat304204&productId=prod739606', 'This product is currently unavailable.', '', 1, '2014-04-11 00:18:55', '0000-00-00 00:00:00'),
(38, 695, 'http://www.finishline.com/store/product?A=330&categoryId=cat304204&productId=prod743908', 'This product is currently unavailable.', '', 1, '2014-04-10 21:05:36', '0000-00-00 00:00:00'),
(39, 696, 'www.finishline.com/store/catalog/product.jsp?productId=prod739603&sourceid=shopping&cid=42&CMP=SCC-GoogleProductSearch-NewTopNav-Mens+Air+Jordan+Retro+3+Basketball+Shoes&gcsct=0ChMIsPWr2-u2vQIVxV3mCh2oTQAAEAA', 'This product is currently unavailable.', '', 1, '2014-04-10 21:05:36', '0000-00-00 00:00:00'),
(40, 697, 'www.finishline.com/store/product?A=825&categoryId=cat304204&productId=prod743915', 'This product is currently unavailable.', '', 1, '2014-04-10 21:06:00', '0000-00-00 00:00:00'),
(41, 698, 'www.finishline.com/store/product/men-s-jordan-retro-10-basketball-shoes?productId=prod739512', 'This product is currently unavailable.', '', 1, '2014-04-10 21:07:28', '0000-00-00 00:00:00'),
(46, 1453, 'http://www.finishline.com/store/product/men-s-air-jordan-1-retro-high-og-ko-basketball-shoes?productId=prod740326', '', '', 1, '2015-07-05 22:02:04', '0000-00-00 00:00:00'),
(47, 1454, 'http://www.finishline.com/store/product/men-s-air-jordan-retro-1-high-og-basketball-shoes?productId=prod733020', '', '', 1, '2015-07-05 22:03:44', '0000-00-00 00:00:00'),
(48, 1116, 'http://www.finishline.com/store/product/men-s-jordan-retro-10-basketball-shoes?productId=prod686699', '', '', 1, '2015-08-20 23:56:10', '0000-00-00 00:00:00'),
(49, 717, 'http://www.finishline.com/store/product/men-s-air-jordan-retro-11-basketball-shoes?productId=prod757959', '', '', 1, '2015-08-20 23:57:25', '0000-00-00 00:00:00'),
(50, 982, 'http://www.finishline.com/store/product/men-s-air-jordan-retro-5-basketball-shoes?productId=prod771351', '', '', 1, '2015-08-21 00:02:27', '0000-00-00 00:00:00'),
(51, 338, 'http://www.finishline.com/store/product/men-s-air-jordan-retro-5-basketball-shoes?productId=prod733018', '', '', 1, '2015-08-21 00:02:27', '0000-00-00 00:00:00'),
(52, 1041, 'http://www.finishline.com/store/product/men-s-air-jordan-retro-5-basketball-shoes?productId=prod771471', '', '', 1, '2015-08-21 00:03:03', '0000-00-00 00:00:00');
