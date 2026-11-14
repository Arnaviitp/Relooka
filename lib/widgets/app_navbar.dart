import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/providers/cart_provider.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/widgets/brand_logo.dart';

/// Top navigation bar: logo, Home / Explore / Rent / Renter / About,
/// search, cart and account.
class AppNavbar extends StatelessWidget implements PreferredSizeWidget {
  /// Route name of the page being shown, used to highlight the active item.
  final String? current;

  const AppNavbar({super.key, this.current});

  /// Below this width the links collapse into a menu button.
  static const wideBreakpoint = 1100.0;

  static const _items = <(String, String)>[
    ('Home', AppRoutes.home),
    ('Explore', AppRoutes.explore),
    ('Rent', AppRoutes.rent),
    ('Renter', AppRoutes.renter),
    ('About', AppRoutes.about),
  ];

  @override
  Size get preferredSize => const Size.fromHeight(72);

  void _go(BuildContext context, String route) {
    if (route == current) return;
    Navigator.of(context).pushReplacementNamed(route);
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= wideBreakpoint;

    return Material(
      color: AppColors.background,
      elevation: 0,
      child: Container(
        height: preferredSize.height,
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        padding: EdgeInsets.symmetric(horizontal: wide ? 40 : 16),
        child: SafeArea(
          bottom: false,
          child: Row(
            children: [
              InkWell(
                onTap: () => _go(context, AppRoutes.home),
                child: const BrandLogo(size: 28),
              ),
              if (wide) ...[
                const SizedBox(width: 32),
                for (final item in _items)
                  _NavLink(
                    label: item.$1,
                    selected: item.$2 == current,
                    onTap: () => _go(context, item.$2),
                  ),
                const SizedBox(width: 16),
                 Expanded(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 340),
                      child: const _SearchBox(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ] else
                const Spacer(),
              const _CartButton(),
              const _AccountButton(),
              if (!wide)
                IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () => _openMenu(context),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _openMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheet) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
              16, 16, 16, 16 + MediaQuery.of(sheet).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const _SearchBox(),
              const SizedBox(height: 8),
              for (final item in _items)
                ListTile(
                  title: Text(item.$1,
                      style:
                          AppTheme.heading(size: 18, weight: FontWeight.w600)),
                  selected: item.$2 == current,
                  selectedColor: AppColors.accent,
                  onTap: () {
                    Navigator.pop(sheet);
                    _go(context, item.$2);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavLink extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _NavLink(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? AppColors.dark : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Text(
            label,
            style: AppTheme.heading(
              size: 16,
              weight: FontWeight.w600,
              color: selected ? Colors.white : AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchBox extends StatelessWidget {
  const _SearchBox();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: TextField(
        textInputAction: TextInputAction.search,
        onSubmitted: (q) =>
            Navigator.of(context).pushNamed(AppRoutes.explore, arguments: q),
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search for clothes, brand or style...',
          hintStyle:
              const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          prefixIcon: const Icon(Icons.search, size: 20),
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(24),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(24),
            borderSide: const BorderSide(color: AppColors.border),
          ),
        ),
      ),
    );
  }
}

class _CartButton extends StatelessWidget {
  const _CartButton();

  @override
  Widget build(BuildContext context) {
    final count = context.watch<CartProvider>().count;
    return IconButton(
      tooltip: 'Cart',
      onPressed: () => Navigator.of(context).pushNamed(AppRoutes.cart),
      icon: Badge(
        isLabelVisible: count > 0,
        label: Text('$count'),
        child: const Icon(Icons.shopping_cart_outlined),
      ),
    );
  }
}

class _AccountButton extends StatelessWidget {
  const _AccountButton();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    return IconButton(
      tooltip: auth.isLoggedIn ? 'Profile (${auth.name})' : 'Log in',
      onPressed: () => Navigator.of(context).pushNamed(
          auth.isLoggedIn ? AppRoutes.profile : AppRoutes.login),
      icon: Icon(auth.isLoggedIn ? Icons.person : Icons.person_outline),
    );
  }
}
