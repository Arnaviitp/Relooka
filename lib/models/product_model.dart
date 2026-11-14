import 'package:flutter/material.dart';

/// Single outfit that can be rented.
class Product {
  final String id;
  final String name;
  final String category; // Saree, Lehenga, Anarkali, Kurta Set, Dress, Co-ord
  final String gender; // Women / Men
  final int rentPerDay;
  final int deposit;
  final String condition; // Like New / Gently Used / Well Loved
  final String fabric;
  final String setIncludes;
  final String description;
  final List<String> sizes;
  final Color color;

  /// Optional real photo (asset path or http URL). Null shows a placeholder.
  final String? imageUrl;

  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.gender,
    required this.rentPerDay,
    required this.condition,
    required this.fabric,
    required this.setIncludes,
    required this.description,
    required this.color,
    this.deposit = 2000,
    this.sizes = const ['S', 'M', 'L', 'XL'],
    this.imageUrl,
  });

  /// Rental price for a package of [days] days (1, 3, 7 or 14).
  int rentPrice(int days) {
    switch (days) {
      case 3:
        return (rentPerDay * 2.5).round();
      case 7:
        return (rentPerDay * 5).round();
      case 14:
        return (rentPerDay * 8).round();
      default:
        return rentPerDay;
    }
  }
}

/// Formats 1499 -> "₹1,499" and 125000 -> "₹1,25,000" (Indian grouping).
String rupees(int value) {
  final s = value.toString();
  if (s.length <= 3) return '₹$s';
  final last3 = s.substring(s.length - 3);
  var rest = s.substring(0, s.length - 3);
  final parts = <String>[];
  while (rest.length > 2) {
    parts.insert(0, rest.substring(rest.length - 2));
    rest = rest.substring(0, rest.length - 2);
  }
  if (rest.isNotEmpty) parts.insert(0, rest);
  return '₹${parts.join(',')},$last3';
}
