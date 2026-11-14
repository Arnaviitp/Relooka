import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/services/product_service.dart';
import 'package:relooka/widgets/page_shell.dart';
import 'package:relooka/widgets/product_card.dart';

/// Browse everything, with a search box and quick category chips.
class ExploreScreen extends StatefulWidget {
  final String? initialQuery;
  const ExploreScreen({super.key, this.initialQuery});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  late final TextEditingController _controller;
  late Future<List<Product>> _future;
  String _category = 'All';

  static const _chips = [
    'All',
    'Saree',
    'Lehenga',
    'Anarkali',
    'Kurta Set',
    'Sherwani',
    'Dress',
    'Co-ord'
  ];

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialQuery ?? '');
    _runSearch();
  }

  void _runSearch() {
    _future = context.read<ProductService>().search(_controller.text);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PageShell(
      route: AppRoutes.explore,
      children: [
        const SectionTitle('Explore'),
        TextField(
          controller: _controller,
          onChanged: (_) => setState(_runSearch),
          decoration: const InputDecoration(
            hintText: 'Search for clothes, brand or style...',
            prefixIcon: Icon(Icons.search),
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final c in _chips)
              ChoiceChip(
                label: Text(c),
                selected: _category == c,
                selectedColor: AppColors.dark,
                showCheckmark: false,
                labelStyle: TextStyle(
                    color:
                        _category == c ? Colors.white : AppColors.textPrimary),
                onSelected: (_) => setState(() => _category = c),
              ),
          ],
        ),
        const SizedBox(height: 24),
        FutureBuilder<List<Product>>(
          future: _future,
          builder: (context, snap) {
            if (!snap.hasData) {
              return const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final items = snap.data!
                .where((p) => _category == 'All' || p.category == _category)
                .toList();
            if (items.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(40),
                child:
                    Center(child: Text('Nothing found. Try another search.')),
              );
            }
            return LayoutBuilder(builder: (context, c) {
              final cols = c.maxWidth >= 860
                  ? 4
                  : c.maxWidth >= 620
                      ? 3
                      : 2;
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
                  onTap: () => Navigator.of(context)
                      .pushNamed(AppRoutes.product, arguments: items[i]),
                ),
              );
            });
          },
        ),
      ],
    );
  }
}
