import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/models/product_model.dart';

/// Product picture: shows [Product.imageUrl] when set, otherwise a coloured
/// placeholder so the layout works before real photos are added.
class ProductImage extends StatelessWidget {
  final Product product;
  final int variant;
  final BoxFit fit;

  const ProductImage(
      {super.key,
      required this.product,
      this.variant = 0,
      this.fit = BoxFit.cover});

  @override
  Widget build(BuildContext context) {
    final placeholder = _Placeholder(color: product.color, variant: variant);
    final url = product.imageUrl;
    if (url == null) return placeholder;
    return url.startsWith('http')
        ? Image.network(url,
            fit: fit, errorBuilder: (_, __, ___) => placeholder)
        : Image.asset(url,
            fit: fit, errorBuilder: (_, __, ___) => placeholder);
  }
}

class _Placeholder extends StatelessWidget {
  final Color color;
  final int variant;
  const _Placeholder({required this.color, required this.variant});

  @override
  Widget build(BuildContext context) {
    final hsl = HSLColor.fromColor(color);
    double lightness(double delta) =>
        (hsl.lightness + delta).clamp(0.0, 1.0).toDouble();
    final light =
        hsl.withLightness(lightness(0.08 + variant * 0.04)).toColor();
    final dark =
        hsl.withLightness(lightness(-0.08 - variant * 0.02)).toColor();
    final isLight = hsl.lightness > 0.65;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: variant.isEven ? Alignment.topLeft : Alignment.topRight,
          end: variant.isEven ? Alignment.bottomRight : Alignment.bottomLeft,
          colors: [light, dark],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.checkroom,
          size: 48,
          color: (isLight ? AppColors.brown : Colors.white).withValues(alpha: 0.55),
        ),
      ),
    );
  }
}

/// Individual product display used in all grids.
class ProductCard extends StatefulWidget {
  final Product product;

  /// Price text under the name. Defaults to "₹X/day".
  final String? priceLabel;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.product,
    this.priceLabel,
    this.onTap,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  bool _liked = false;

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final price = widget.priceLabel ?? '${rupees(p.rentPerDay)}/day';

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: widget.onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ProductImage(product: p),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: GestureDetector(
                      onTap: () => setState(() => _liked = !_liked),
                      child: CircleAvatar(
                        radius: 15,
                        backgroundColor: Colors.white.withValues(alpha: 0.9),
                        child: Icon(
                          _liked ? Icons.favorite : Icons.favorite_border,
                          size: 17,
                          color: _liked ? AppColors.maroon : AppColors.dark,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text(price,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                          color: AppColors.textPrimary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
