import 'package:flutter/foundation.dart';

import 'package:relooka/models/listing_model.dart';

/// Outfits the signed-in user has listed for rent.
class ListingProvider extends ChangeNotifier {
  final List<OutfitListing> _listings = [];

  List<OutfitListing> get listings => List.unmodifiable(_listings.reversed);

  OutfitListing add({
    required String name,
    required String category,
    required String condition,
    required String size,
    required int rentPerDay,
    required int deposit,
    required String description,
    required List<CapturedPhoto> photos,
  }) {
    final listing = OutfitListing(
      id: 'RLK-L-${2001 + _listings.length}',
      name: name,
      category: category,
      condition: condition,
      size: size,
      rentPerDay: rentPerDay,
      deposit: deposit,
      description: description,
      photos: List.unmodifiable(photos),
      createdAt: DateTime.now(),
    );
    _listings.add(listing);
    notifyListeners();
    return listing;
  }

  void remove(String id) {
    _listings.removeWhere((l) => l.id == id);
    notifyListeners();
  }

  void clear() {
    _listings.clear();
    notifyListeners();
  }
}
