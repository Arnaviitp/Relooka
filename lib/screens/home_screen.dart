import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/services/product_service.dart';
import 'package:relooka/widgets/page_shell.dart';
import 'package:relooka/widgets/product_card.dart';

/// Landing page with entry points to Rent and List Outfit.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final Future<List<Product>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<ProductService>().fetchProducts();
  }

  @override
  Widget build(BuildContext context) {
    final nav = Navigator.of(context);
    return PageShell(
      route: AppRoutes.home,
      children: [
        HeroBanner(
          title: 'Rent Your Next Look',
          subtitle:
              'Wear something special without buying it.\nDiscover outfits for every occasion.',
          buttonLabel: 'Browse Rentals',
          onPressed: () => nav.pushReplacementNamed(AppRoutes.rent),
        ),
        const SizedBox(height: 32),
        const SectionTitle('What would you like to do?'),
        LayoutBuilder(builder: (context, c) {
          final cols = c.maxWidth >= 700 ? 2 : 1;
          const gap = 16.0;
          final w = (c.maxWidth - gap * (cols - 1)) / cols;
          Widget tile(String title, String sub, IconData icon, String route,
                  Color color) =>
              SizedBox(
                width: w,
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () => nav.pushReplacementNamed(route),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(children: [
                      Icon(icon, size: 36, color: AppColors.brown),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: AppTheme.heading(size: 22)),
                            const SizedBox(height: 4),
                            Text(sub,
                                style: const TextStyle(
                                    color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward),
                    ]),
                  ),
                ),
              );
          return Wrap(spacing: gap, runSpacing: gap, children: [
            tile('Rent an outfit', 'Wear it, return it',
                Icons.event_available_outlined, AppRoutes.rent,
                const Color(0xFFF1E1CC)),
            tile('Become a renter', 'Earn by renting out your wardrobe',
                Icons.add_a_photo_outlined, AppRoutes.renter,
                const Color(0xFFE9DCC8)),
          ]);
        }),
        const SizedBox(height: 36),
        const SectionTitle('Trending Now'),
        FutureBuilder<List<Product>>(
          future: _future,
          builder: (context, snap) {
            if (!snap.hasData) {
              return const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final items = snap.data!.take(4).toList();
            return LayoutBuilder(builder: (context, c) {
              final cols = c.maxWidth >= 860 ? 4 : 2;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cols,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.66,
                ),
                itemBuilder: (_, i) => ProductCard(
                  product: items[i],
                  onTap: () => nav.pushNamed(AppRoutes.product,
                      arguments: items[i]),
                ),
              );
            });
          },
        ),
        const SizedBox(height: 32),
        const FeatureStrip(items: [
          FeatureItem(Icons.event_available_outlined, 'Flexible Rentals',
              'Choose the duration that fits you'),
          FeatureItem(Icons.verified_user_outlined, 'Quality Assured',
              'Clean, well-maintained outfits'),
          FeatureItem(Icons.eco_outlined, 'Sustainable Fashion',
              'Look good while reducing waste'),
        ]),
      ],
    );
  }
}
