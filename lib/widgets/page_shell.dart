import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_theme.dart';
import 'package:relooka/widgets/app_navbar.dart';
import 'package:relooka/widgets/custom_button.dart';

/// Shared page frame: navbar + centred, max-width scrolling body.
class PageShell extends StatelessWidget {
  final String? route;
  final List<Widget> children;

  const PageShell({super.key, required this.route, required this.children});

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;
    return Scaffold(
      appBar: AppNavbar(current: route),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1240),
            child: Padding(
              padding: EdgeInsets.symmetric(
                  horizontal: wide ? 40 : 16, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: children,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String text;
  final String? trailing;
  const SectionTitle(this.text, {super.key, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 10,
        runSpacing: 4,
        children: [
          Text(text, style: AppTheme.heading(size: 30)),
          if (trailing != null)
            Text(trailing!,
                style: const TextStyle(
                    fontSize: 15, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

/// Large rounded banner with text on the left and a picture on the right.
class HeroBanner extends StatelessWidget {
  final String? eyebrow;
  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onPressed;
  final Color imageColor;

  /// Optional real hero photo (asset path or http URL).
  final String? imageUrl;

  const HeroBanner({
    super.key,
    this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.onPressed,
    this.imageColor = AppColors.maroon,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;

    final text = Padding(
      padding: EdgeInsets.all(wide ? 40 : 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (eyebrow != null) ...[
            Text(eyebrow!,
                style: const TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                    fontSize: 14)),
            const SizedBox(height: 8),
          ],
          Text(title,
              style: AppTheme.heading(
                  size: wide ? 44 : 30, color: Colors.white, height: 1.1)),
          const SizedBox(height: 14),
          Text(subtitle,
              style: TextStyle(
                  fontSize: wide ? 17 : 15,
                  color: Colors.white.withValues(alpha: 0.9),
                  height: 1.4)),
          const SizedBox(height: 24),
          CustomButton(
            label: buttonLabel,
            trailingIcon: Icons.arrow_forward,
            style: CustomButtonStyle.accent,
            onPressed: onPressed,
          ),
        ],
      ),
    );

    final picture = imageUrl != null
        ? (imageUrl!.startsWith('http')
            ? Image.network(imageUrl!, fit: BoxFit.cover)
            : Image.asset(imageUrl!, fit: BoxFit.cover))
        : Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [AppColors.brown, imageColor],
              ),
            ),
            child: Center(
              child: Icon(Icons.checkroom,
                  size: 90, color: Colors.white.withValues(alpha: 0.35)),
            ),
          );

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Container(
        color: AppColors.brown,
        constraints: BoxConstraints(minHeight: wide ? 360 : 0),
        child: wide
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(flex: 6, child: text),
                  Expanded(
                    flex: 5,
                    child: SizedBox(
                      height: 380,
                      child: picture,
                    ),
                  ),
                ],
              )
            : text,
      ),
    );
  }
}

class FeatureItem {
  final IconData icon;
  final String title;
  final String subtitle;
  const FeatureItem(this.icon, this.title, this.subtitle);
}

/// Dark strip with three selling points shown at the bottom of pages.
class FeatureStrip extends StatelessWidget {
  final List<FeatureItem> items;
  const FeatureStrip({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 800;

    Widget tile(FeatureItem i) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(i.icon, color: AppColors.accent, size: 32),
            const SizedBox(width: 14),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(i.title,
                      style: AppTheme.heading(
                          size: 17, color: Colors.white)),
                  const SizedBox(height: 2),
                  Text(i.subtitle,
                      style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.8))),
                ],
              ),
            ),
          ],
        );

    final children = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      children.add(wide ? Expanded(child: Center(child: tile(items[i]))) : tile(items[i]));
      if (i < items.length - 1) {
        children.add(wide
            ? Container(width: 1, height: 44, color: Colors.white24)
            : const SizedBox(height: 18));
      }
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
      decoration: BoxDecoration(
        color: AppColors.dark,
        borderRadius: BorderRadius.circular(18),
      ),
      child: wide
          ? Row(children: children)
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}
