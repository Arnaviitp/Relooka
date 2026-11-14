import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/models/product_model.dart';
import 'package:relooka/providers/cart_provider.dart';
import 'package:relooka/services/product_service.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/page_shell.dart';
import 'package:relooka/widgets/product_card.dart';

/// Product detail: gallery, duration and size pickers, details tabs and
/// related items.
class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late final Future<List<Product>> _related;
  int _days = 3;
  late String _size =
      widget.product.sizes.contains('M') ? 'M' : widget.product.sizes.first;
  int _image = 0;
  int _tab = 0;
  bool _liked = false;

  Product get p => widget.product;

  @override
  void initState() {
    super.initState();
    _related = context.read<ProductService>().related(widget.product);
  }

  void _addToCart({bool goToCart = false}) {
    context
        .read<CartProvider>()
        .add(CartItem(product: p, days: _days, size: _size));
    if (goToCart) {
      Navigator.of(context).pushNamed(AppRoutes.cart);
    } else {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Added to cart')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;

    return PageShell(
      route: AppRoutes.rent,
      children: [
        _breadcrumb(context),
        const SizedBox(height: 24),
        if (wide)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 6, child: _gallery(true)),
              const SizedBox(width: 32),
              Expanded(flex: 6, child: _info(true)),
            ],
          )
        else ...[
          _gallery(false),
          const SizedBox(height: 24),
          _info(false),
        ],
        const SizedBox(height: 40),
        if (wide)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 4, child: _tabs()),
              const SizedBox(width: 32),
              Expanded(flex: 6, child: _relatedSection()),
            ],
          )
        else ...[
          _tabs(),
          const SizedBox(height: 32),
          _relatedSection(),
        ],
      ],
    );
  }

  // ---- Breadcrumb ---------------------------------------------------------

  Widget _breadcrumb(BuildContext context) {
    Widget crumb(String t, {VoidCallback? onTap}) => InkWell(
          onTap: onTap,
          child: Text(t,
              style: TextStyle(
                  fontSize: 13,
                  color: onTap == null
                      ? AppColors.textPrimary
                      : AppColors.textSecondary)),
        );
    const sep = Padding(
      padding: EdgeInsets.symmetric(horizontal: 8),
      child: Icon(Icons.chevron_right, size: 16),
    );
    final nav = Navigator.of(context);
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        crumb('Home',
            onTap: () =>
                nav.pushNamedAndRemoveUntil(AppRoutes.home, (_) => false)),
        sep,
        crumb('Rent',
            onTap: () => nav.pushReplacementNamed(AppRoutes.rent)),
        sep,
        crumb(p.category),
        sep,
        crumb(p.name),
      ],
    );
  }

  // ---- Gallery ------------------------------------------------------------

  Widget _gallery(bool wide) {
    final thumbs = [
      for (var i = 0; i < 4; i++)
        Padding(
          padding:
              EdgeInsets.only(bottom: wide ? 12 : 0, right: wide ? 0 : 10),
          child: InkWell(
            onTap: () => setState(() => _image = i),
            child: Container(
              width: wide ? 84 : 64,
              height: wide ? 100 : 80,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: i == _image ? AppColors.dark : Colors.transparent,
                    width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ProductImage(product: p, variant: i),
              ),
            ),
          ),
        ),
    ];

    final main = AspectRatio(
      aspectRatio: 1.0,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          fit: StackFit.expand,
          children: [
            ProductImage(product: p, variant: _image),
            Positioned(
              top: 14,
              right: 14,
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.9),
                child: IconButton(
                  icon: Icon(_liked ? Icons.favorite : Icons.favorite_border,
                      color: _liked ? AppColors.maroon : AppColors.dark),
                  onPressed: () => setState(() => _liked = !_liked),
                ),
              ),
            ),
            Positioned(
              left: 12,
              top: 0,
              bottom: 0,
              child: _arrow(Icons.chevron_left,
                  () => setState(() => _image = (_image + 3) % 4)),
            ),
            Positioned(
              right: 12,
              top: 0,
              bottom: 0,
              child: _arrow(Icons.chevron_right,
                  () => setState(() => _image = (_image + 1) % 4)),
            ),
          ],
        ),
      ),
    );

    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(children: thumbs),
          const SizedBox(width: 16),
          Expanded(child: main),
        ],
      );
    }
    return Column(children: [
      main,
      const SizedBox(height: 12),
      Row(children: thumbs),
    ]);
  }

  Widget _arrow(IconData icon, VoidCallback onTap) => Center(
        child: CircleAvatar(
          radius: 18,
          backgroundColor: Colors.white.withValues(alpha: 0.9),
          child: IconButton(
            padding: EdgeInsets.zero,
            icon: Icon(icon, size: 22),
            onPressed: onTap,
          ),
        ),
      );

  // ---- Info column --------------------------------------------------------

  Widget _info(bool wide) {
    const perks = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Perk(Icons.autorenew, 'Flexible Rental', 'Wear, return, repeat'),
        _Perk(Icons.verified_user_outlined, 'Secure & Hygienic',
            'Professionally cleaned'),
        _Perk(Icons.local_shipping_outlined, 'Free Pick-up & Return',
            'Across major cities'),
      ],
    );

    final availability = Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Row(children: [
        Icon(Icons.circle, size: 12, color: AppColors.success),
        SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Available', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(height: 2),
            Text('Ships in 1–2 days', style: TextStyle(fontSize: 13)),
          ],
        ),
      ]),
    );

    final main = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(p.name, style: AppTheme.heading(size: 34)),
        const SizedBox(height: 6),
        Text('${p.gender}  •  Ethnic Wear',
            style: const TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 22),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(rupees(p.rentPrice(_days)),
                style: AppTheme.heading(size: 30)),
            Text('  / $_days days',
                style: AppTheme.heading(size: 20, weight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 8),
        Row(children: [
          Flexible(
            child: Text('Security Deposit: ${rupees(p.deposit)} (refundable)',
                style: const TextStyle(color: AppColors.textSecondary)),
          ),
          const SizedBox(width: 6),
          const Tooltip(
            message: 'Returned after the outfit is back and checked.',
            child: Icon(Icons.info_outline,
                size: 18, color: AppColors.textSecondary),
          ),
        ]),
        const SizedBox(height: 22),
        const Text('Rental Duration',
            style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final d in const [3, 7, 14])
            _Chip(
              label: '$d Days',
              selected: _days == d,
              onTap: () => setState(() => _days = d),
              wide: true,
            ),
        ]),
        const SizedBox(height: 22),
        const Text('Size', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final s in p.sizes)
            _Chip(
              label: s,
              selected: _size == s,
              onTap: () => setState(() => _size = s),
            ),
        ]),
        const SizedBox(height: 26),
        CustomButton(
          label: 'Rent Now',
          expanded: true,
          onPressed: () => _addToCart(goToCart: true),
        ),
        const SizedBox(height: 12),
        CustomButton(
          label: 'Add to Cart',
          leadingIcon: Icons.shopping_cart_outlined,
          style: CustomButtonStyle.outline,
          expanded: true,
          onPressed: () => _addToCart(),
        ),
      ],
    );

    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 6, child: main),
          const SizedBox(width: 24),
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [availability, const SizedBox(height: 22), perks],
            ),
          ),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        main,
        const SizedBox(height: 22),
        availability,
        const SizedBox(height: 18),
        perks,
      ],
    );
  }

  // ---- Tabs ---------------------------------------------------------------

  Widget _tabs() {
    const titles = ['Details', 'Size Guide', 'Rental Policy'];
    Widget content;
    switch (_tab) {
      case 1:
        content = const Text(
          'S – Bust 34", Waist 28"\nM – Bust 36", Waist 30"\n'
          'L – Bust 38", Waist 32"\nXL – Bust 40", Waist 34"',
          style: TextStyle(height: 1.7, fontSize: 15),
        );
        break;
      case 2:
        content = const Text(
          'Rent for 3, 7 or 14 days. A refundable security deposit is '
          'collected at checkout and returned after the outfit is received '
          'and checked. Free pick-up and return in major cities. Late '
          'returns are charged per extra day.',
          style: TextStyle(height: 1.6, fontSize: 15),
        );
        break;
      default:
        content = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(p.description,
                style: const TextStyle(height: 1.6, fontSize: 15)),
            const SizedBox(height: 20),
            _spec('Condition', p.condition),
            _spec('Fabric', p.fabric),
            _spec('Set Includes', p.setIncludes),
          ],
        );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.border)),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (var i = 0; i < titles.length; i++)
                InkWell(
                  onTap: () => setState(() => _tab = i),
                  child: Container(
                    margin: const EdgeInsets.only(right: 28),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                            color: i == _tab
                                ? AppColors.dark
                                : Colors.transparent,
                            width: 2.5),
                      ),
                    ),
                    child: Text(titles[i],
                        style: AppTheme.heading(
                            size: 17,
                            weight:
                                i == _tab ? FontWeight.w700 : FontWeight.w500)),
                  ),
                ),
            ]),
          ),
        ),
        const SizedBox(height: 18),
        content,
      ],
    );
  }

  Widget _spec(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
            width: 120,
            child: Text(k,
                style: AppTheme.heading(size: 16, weight: FontWeight.w600)),
          ),
          Expanded(child: Text(v)),
        ]),
      );

  // ---- Related ------------------------------------------------------------

  Widget _relatedSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('You May Also Like', style: AppTheme.heading(size: 24)),
        const SizedBox(height: 16),
        FutureBuilder<List<Product>>(
          future: _related,
          builder: (context, snap) {
            if (!snap.hasData) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final items = snap.data!;
            return LayoutBuilder(builder: (context, c) {
              final cols = c.maxWidth >= 600 ? 4 : 2;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cols,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.62,
                ),
                itemBuilder: (_, i) => ProductCard(
                  product: items[i],
                  priceLabel:
                      '${rupees(items[i].rentPrice(3))} / 3 days',
                  onTap: () => Navigator.of(context).pushReplacementNamed(
                    AppRoutes.product,
                    arguments: items[i],
                  ),
                ),
              );
            });
          },
        ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final bool wide;
  final VoidCallback onTap;
  const _Chip(
      {required this.label,
      required this.selected,
      required this.onTap,
      this.wide = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        padding:
            EdgeInsets.symmetric(horizontal: wide ? 28 : 22, vertical: 11),
        decoration: BoxDecoration(
          color:
              selected ? AppColors.dark.withValues(alpha: 0.06) : AppColors.surface,
          border: Border.all(
              color: selected ? AppColors.dark : AppColors.border,
              width: selected ? 1.6 : 1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(label,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
      ),
    );
  }
}

class _Perk extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _Perk(this.icon, this.title, this.subtitle);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(children: [
        Icon(icon, size: 30),
        const SizedBox(width: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: AppTheme.heading(size: 15, weight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(subtitle,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary)),
          ],
        ),
      ]),
    );
  }
}
