import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_theme.dart';

/// "ReLooka" wordmark where the two o's are drawn as one infinity sign.
class BrandLogo extends StatelessWidget {
  final double size;
  final Color textColor;

  const BrandLogo({
    super.key,
    this.size = 28,
    this.textColor = AppColors.textPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'ReLooka',
      child: ExcludeSemantics(
        child: RichText(
          text: TextSpan(
            style: AppTheme.heading(size: size, color: textColor),
            children: [
              const TextSpan(
                  text: 'Re', style: TextStyle(color: AppColors.accent)),
              const TextSpan(text: 'L'),
              WidgetSpan(
                alignment: PlaceholderAlignment.baseline,
                baseline: TextBaseline.alphabetic,
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: size * 0.03),
                  child: InfinityMark(size: size),
                ),
              ),
              const TextSpan(text: 'ka'),
            ],
          ),
        ),
      ),
    );
  }
}

/// A hand-drawn infinity sign (lemniscate) sized to sit where "oo" would.
class InfinityMark extends StatelessWidget {
  /// Font size of the surrounding text; the mark scales with it.
  final double size;
  final Color color;

  const InfinityMark({
    super.key,
    required this.size,
    this.color = AppColors.accent,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size * 0.98,
      height: size * 0.5,
      child: CustomPaint(painter: _InfinityPainter(color, size * 0.085)),
    );
  }
}

class _InfinityPainter extends CustomPainter {
  final Color color;
  final double stroke;

  _InfinityPainter(this.color, this.stroke);

  @override
  void paint(Canvas canvas, Size s) {
    final path = Path();
    const steps = 160;
    // Lemniscate of Gerono-style parametrisation; its vertical extent is
    // +/-0.35355 of its half-width, so scale y up to fill the box.
    final rx = (s.width - stroke) / 2;
    final ry = (s.height - stroke) / 2 / 0.35355339;
    for (var i = 0; i <= steps; i++) {
      final t = 2 * math.pi * i / steps;
      final d = 1 + math.sin(t) * math.sin(t);
      final x = s.width / 2 + rx * math.cos(t) / d;
      final y = s.height / 2 + ry * math.sin(t) * math.cos(t) / d;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..isAntiAlias = true,
    );
  }

  @override
  bool shouldRepaint(covariant _InfinityPainter old) =>
      old.color != color || old.stroke != stroke;
}
