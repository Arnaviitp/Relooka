import 'dart:typed_data';

/// One verification photo captured live with the camera.
class CapturedPhoto {
  final String angle; // Front, Back, Left side, ...
  final Uint8List bytes;
  const CapturedPhoto({required this.angle, required this.bytes});
}

/// An outfit a user lists for rent. Starts as "Under review" until the
/// verification photos are checked.
class OutfitListing {
  final String id;
  final String name;
  final String category;
  final String condition;
  final String size;
  final int rentPerDay;
  final int deposit;
  final String description;
  final List<CapturedPhoto> photos;
  final DateTime createdAt;
  final String status;

  const OutfitListing({
    required this.id,
    required this.name,
    required this.category,
    required this.condition,
    required this.size,
    required this.rentPerDay,
    required this.deposit,
    required this.description,
    required this.photos,
    required this.createdAt,
    this.status = 'Under review',
  });
}
