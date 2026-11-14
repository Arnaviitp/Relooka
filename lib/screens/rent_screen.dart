import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/services/product_service.dart';
import 'package:relooka/widgets/page_shell.dart';
import 'package:relooka/widgets/product_card.dart';

class _Collection {
  final String label;
  final String category; // matches Product.category
  final IconData icon;
  final Color color;
  const _Collection(this.label, this.category, this.icon, this.color);
}

/// Renters page: hero, rental collections, filter sidebar, product grid,
/// pagination and feature strip.
class RentScreen extends StatefulWidget {
  const RentScreen({super.key});

  @override
  State<RentScreen> createState() => _RentScreenState();
}

class _RentScreenState extends State<RentScreen> {
  static const _pageSize = 4;
  static const _categories = [
    'Saree',
    'Lehenga',
    'Anarkali',
    'Kurta Set',
    'Sherwani',
    'Dress',
    'Co-ord'
  ];
  static const _sizes = ['XS', 'S', 'M', 'L', 'XL'];
  static const _durations = [1, 3, 7, 14];
  static const _bounds = RangeValues(300, 2000);
  static const _collections = [
    _Collection('Wedding & Festive', 'Lehenga', Icons.diamond_outlined,
        Color(0xFF8B1A2B)),
    _Collection('Traditional Wear', 'Saree', Icons.spa_outlined,
        Color(0xFFD9C3A0)),
    _Collection('Casual Ethnic', 'Kurta Set', Icons.dry_cleaning_outlined,
        Color(0xFFE2C9A8)),
    _Collection("Men's Collection", 'Sherwani', Icons.person_outline,
        Color(0xFFCDBBA2)),
  ];

  late final Future<List<Product>> _future;
  final Set<String> _selCategories = {};
  final Set<String> _selSizes = {};
  int? _duration; // null = show per-day price
  RangeValues _range = _bounds;
  int _page = 0;
  String _sort = 'Recommended';

  @override
  void initState() {
    super.initState();
    _future = context.read<ProductService>().fetchProducts();
  }

  List<Product> _apply(List<Product> all) {
    final out = all.where((p) {
      if (_selCategories.isNotEmpty && !_selCategories.contains(p.category)) {
        return false;
      }
      if (_selSizes.isNotEmpty && !p.sizes.any(_selSizes.contains)) {
        return false;
      }
      return p.rentPerDay >= _range.start && p.rentPerDay <= _range.end;
    }).toList();

    if (_sort == 'Price: Low to High') {
      out.sort((a, b) => a.rentPerDay.compareTo(b.rentPerDay));
    } else if (_sort == 'Price: High to Low') {
      out.sort((a, b) => b.rentPerDay.compareTo(a.rentPerDay));
    }
    return out;
  }

  String _priceLabel(Product p) {
    final d = _duration;
    if (d == null) return '${rupees(p.rentPerDay)}/day';
    return '${rupees(p.rentPrice(d))} / ${d == 1 ? '1 day' : '$d days'}';
  }

  void _setCategory(String category) {
    setState(() {
      _selCategories
        ..clear()
        ..add(category);
      _page = 0;
    });
  }

  void _clearAll() {
    setState(() {
      _selCategories.clear();
      _selSizes.clear();
      _duration = null;
      _range = _bounds;
      _page = 0;
    });
  }

  /// Applies a filter change and returns to the first page.
  void _changed(VoidCallback fn) => setState(() {
        fn();
        _page = 0;
      });

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;

    return PageShell(
      route: AppRoutes.rent,
      children: [
        HeroBanner(
          title: 'Rent Your Next Look',
          subtitle:
              'Wear something special without buying it.\nDiscover outfits for every occasion.',
          buttonLabel: 'Browse Rentals',
          imageColor: AppColors.maroon,
          onPressed: () {},
        ),
        const SizedBox(height: 32),
        const SectionTitle('Explore Rental Collections'),
        _collectionTiles(),
        const SizedBox(height: 32),
        FutureBuilder<List<Product>>(
          future: _future,
          builder: (context, snap) {
            if (!snap.hasData) {
              return const Padding(
                padding: EdgeInsets.all(60),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final items = _apply(snap.data!);
            final pages = math.max(1, (items.length / _pageSize).ceil());
            final page = math.min(_page, pages - 1);
            final visible =
                items.skip(page * _pageSize).take(_pageSize).toList();

            final grid = _grid(visible, pages, page);
            if (wide) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(width: 250, child: _filterPanel()),
                  const SizedBox(width: 28),
                  Expanded(child: grid),
                ],
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Theme(
                  data: Theme.of(context)
                      .copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    title: const Text('Filter',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                    collapsedBackgroundColor: AppColors.surface,
                    backgroundColor: AppColors.surface,
                    childrenPadding: const EdgeInsets.all(16),
                    children: [_filterBody()],
                  ),
                ),
                const SizedBox(height: 20),
                grid,
              ],
            );
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

  // ---- Collections --------------------------------------------------------

  Widget _collectionTiles() {
    return LayoutBuilder(builder: (context, c) {
      final perRow = c.maxWidth >= 900 ? 4 : 2;
      const gap = 16.0;
      final w = (c.maxWidth - gap * (perRow - 1)) / perRow;
      return Wrap(
        spacing: gap,
        runSpacing: gap,
        children: [
          for (final t in _collections)
            SizedBox(
              width: w,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => _setCategory(t.category),
                child: Container(
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(children: [
                    Expanded(
                      child: Container(
                        width: double.infinity,
                        color: t.color,
                        child: Icon(Icons.checkroom,
                            size: 36, color: Colors.white.withValues(alpha: 0.5)),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(t.icon, size: 18),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(t.label,
                                overflow: TextOverflow.ellipsis,
                                style: AppTheme.heading(
                                    size: 15, weight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ),
                  ]),
                ),
              ),
            ),
        ],
      );
    });
  }

  // ---- Grid ---------------------------------------------------------------

  Widget _grid(List<Product> visible, int pages, int page) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(child: SectionTitle('Popular Rentals')),
            const Text('Sort by: ', style: TextStyle(fontSize: 13)),
            DropdownButton<String>(
              value: _sort,
              underline: const SizedBox.shrink(),
              style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500),
              items: const [
                'Recommended',
                'Price: Low to High',
                'Price: High to Low',
              ]
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (v) => _changed(() => _sort = v ?? _sort),
            ),
          ],
        ),
        if (visible.isEmpty)
          const Padding(
            padding: EdgeInsets.all(48),
            child: Center(child: Text('No outfits match these filters.')),
          )
        else
          LayoutBuilder(builder: (context, c) {
            final cols = c.maxWidth >= 860
                ? 4
                : c.maxWidth >= 620
                    ? 3
                    : 2;
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: visible.length,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: cols,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.66,
              ),
              itemBuilder: (_, i) => ProductCard(
                product: visible[i],
                priceLabel: _priceLabel(visible[i]),
                onTap: () => Navigator.of(context)
                    .pushNamed(AppRoutes.product, arguments: visible[i]),
              ),
            );
          }),
        const SizedBox(height: 24),
        Center(child: _pagination(pages, page)),
      ],
    );
  }

  Widget _pagination(int pages, int page) {
    Widget box(Widget child, VoidCallback? onTap, {bool selected = false}) =>
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: InkWell(
            borderRadius: BorderRadius.circular(10),
            onTap: onTap,
            child: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? AppColors.dark : AppColors.surface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: child,
            ),
          ),
        );

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        box(const Icon(Icons.arrow_back, size: 18),
            page > 0 ? () => setState(() => _page = page - 1) : null),
        for (var i = 0; i < pages; i++)
          box(
            Text('${i + 1}',
                style: TextStyle(
                    color: i == page ? Colors.white : AppColors.textPrimary,
                    fontWeight: FontWeight.w600)),
            () => setState(() => _page = i),
            selected: i == page,
          ),
        box(const Icon(Icons.arrow_forward, size: 18),
            page < pages - 1 ? () => setState(() => _page = page + 1) : null),
      ],
    );
  }

  // ---- Filters ------------------------------------------------------------

  Widget _filterPanel() => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
        ),
        child: _filterBody(showHeader: true),
      );

  Widget _filterBody({bool showHeader = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: showHeader
              ? MainAxisAlignment.spaceBetween
              : MainAxisAlignment.end,
          children: [
            if (showHeader) Text('Filter', style: AppTheme.heading(size: 20)),
            TextButton(
              onPressed: _clearAll,
              child: const Text('Clear All',
                  style: TextStyle(color: AppColors.textSecondary)),
            ),
          ],
        ),
        const Divider(),
        _group('Category', [
          for (final c in _categories) _check(c, _selCategories),
        ]),
        _group('Rental Duration', [
          for (final d in _durations)
            InkWell(
              onTap: () => setState(
                  () => _duration = _duration == d ? null : d),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(children: [
                  Icon(
                    _duration == d
                        ? Icons.radio_button_checked
                        : Icons.radio_button_off,
                    size: 20,
                    color: _duration == d
                        ? AppColors.dark
                        : AppColors.textSecondary,
                  ),
                  const SizedBox(width: 10),
                  Text(d == 1 ? '1 Day' : '$d Days',
                      style: const TextStyle(fontSize: 14)),
                ]),
              ),
            ),
        ]),
        _group('Size', [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final s in _sizes)
                _SizeChip(
                  label: s,
                  selected: _selSizes.contains(s),
                  onTap: () => _changed(() {
                    if (!_selSizes.add(s)) _selSizes.remove(s);
                  }),
                ),
            ],
          ),
        ]),
        _group('Price / Day', [
          RangeSlider(
            values: _range,
            min: _bounds.start,
            max: _bounds.end,
            activeColor: AppColors.accent,
            inactiveColor: AppColors.border,
            onChanged: (v) => _changed(() => _range = v),
          ),
          Text('₹${_range.start.round()} – ₹${_range.end.round()}',
              style: const TextStyle(fontSize: 13)),
        ]),
      ],
    );
  }

  Widget _group(String title, List<Widget> children) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 8),
            ...children,
            const Divider(height: 20),
          ],
        ),
      );

  Widget _check(String label, Set<String> target) {
    final on = target.contains(label);
    return InkWell(
      onTap: () => _changed(() {
        if (!target.add(label)) target.remove(label);
      }),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(children: [
          Icon(on ? Icons.check_box : Icons.check_box_outline_blank,
              size: 20,
              color: on ? AppColors.dark : AppColors.textSecondary),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(fontSize: 14)),
        ]),
      ),
    );
  }
}

class _SizeChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _SizeChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.dark : Colors.transparent,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 13,
                color: selected ? Colors.white : AppColors.textPrimary)),
      ),
    );
  }
}
