import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/core/app_routes.dart';
import 'package:relooka/core/validators.dart';
import 'package:relooka/models/listing_model.dart';
import 'package:relooka/providers/listing_provider.dart';
import 'package:relooka/screens/camera_capture_screen.dart';
import 'package:relooka/services/auth_service.dart';
import 'package:relooka/widgets/custom_button.dart';
import 'package:relooka/widgets/custom_text_field.dart';
import 'package:relooka/widgets/page_shell.dart';

/// List your outfit for rent. Verification requires at least 4 photos taken
/// live with the camera from different angles.
class ListOutfitScreen extends StatefulWidget {
  const ListOutfitScreen({super.key});

  @override
  State<ListOutfitScreen> createState() => _ListOutfitScreenState();
}

class _ListOutfitScreenState extends State<ListOutfitScreen> {
  static const _categories = [
    'Saree',
    'Lehenga',
    'Anarkali',
    'Kurta Set',
    'Sherwani',
    'Dress',
    'Co-ord'
  ];
  static const _conditions = ['Like New', 'Gently Used', 'Well Loved'];
  static const _sizes = ['XS', 'S', 'M', 'L', 'XL', 'Free'];

  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _rent = TextEditingController();
  final _deposit = TextEditingController();
  final _desc = TextEditingController();
  String _category = _categories.first;
  String _condition = _conditions.first;
  String _size = 'M';
  List<CapturedPhoto> _photos = [];
  String? _photoError;

  @override
  void dispose() {
    _name.dispose();
    _rent.dispose();
    _deposit.dispose();
    _desc.dispose();
    super.dispose();
  }

  Future<void> _openCamera() async {
    final result = await Navigator.of(context).push<List<CapturedPhoto>>(
      MaterialPageRoute(
        builder: (_) => CameraCaptureScreen(initial: _photos),
      ),
    );
    if (result != null && mounted) {
      setState(() {
        _photos = result;
        _photoError = null;
      });
    }
  }

  Future<void> _submit() async {
    final formOk = _formKey.currentState!.validate();
    final photosOk = _photos.length >= CameraCaptureScreen.minPhotos;
    setState(() => _photoError = photosOk
        ? null
        : 'Capture at least ${CameraCaptureScreen.minPhotos} photos from '
            'different angles to verify your outfit.');
    if (!formOk || !photosOk) return;

    final listings = context.read<ListingProvider>();
    final listing = listings.add(
      name: _name.text.trim(),
      category: _category,
      condition: _condition,
      size: _size,
      rentPerDay: int.parse(_rent.text.trim()),
      deposit: int.parse(_deposit.text.trim()),
      description: _desc.text.trim(),
      photos: _photos,
    );

    _formKey.currentState!.reset();
    _name.clear();
    _rent.clear();
    _deposit.clear();
    _desc.clear();
    setState(() => _photos = []);

    await showDialog<void>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: const Text('Listing submitted'),
        content: Text(
            '${listing.name} (${listing.id}) is now under review. We will '
            'check your ${listing.photos.length} verification photos before '
            'it goes live.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialog), child: const Text('Done')),
          TextButton(
            onPressed: () {
              Navigator.pop(dialog);
              Navigator.of(context).pushReplacementNamed(AppRoutes.renter);
            },
            child: const Text('View my listings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    return PageShell(
      route: AppRoutes.renter,
      children: [
        const SectionTitle('List Your Outfit for Rent'),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(18),
              ),
              child: auth.isLoggedIn ? _form() : _loginPrompt(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _loginPrompt() => Column(
        children: [
          const Icon(Icons.lock_outline, size: 36),
          const SizedBox(height: 12),
          const Text('Log in to list an outfit',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
          const SizedBox(height: 6),
          const Text(
            'We verify every listing and link it to your ReLooka ID.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),
          Wrap(spacing: 12, runSpacing: 12, children: [
            CustomButton(
              label: 'Log in',
              onPressed: () =>
                  Navigator.of(context).pushNamed(AppRoutes.login),
            ),
            CustomButton(
              label: 'Create account',
              style: CustomButtonStyle.outline,
              onPressed: () =>
                  Navigator.of(context).pushNamed(AppRoutes.register),
            ),
          ]),
        ],
      );

  Widget _form() => Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CustomTextField(
              label: 'Outfit name',
              hint: 'e.g. Maroon Silk Saree',
              controller: _name,
              validator: (v) => Validators.required(v, 'Outfit name'),
            ),
            const SizedBox(height: 16),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                  child: _dropdown('Category', _category, _categories,
                      (v) => setState(() => _category = v))),
              const SizedBox(width: 14),
              Expanded(
                  child: _dropdown('Size', _size, _sizes,
                      (v) => setState(() => _size = v))),
            ]),
            const SizedBox(height: 16),
            _dropdown('Condition', _condition, _conditions,
                (v) => setState(() => _condition = v)),
            const SizedBox(height: 16),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: CustomTextField(
                  label: 'Rent per day (₹)',
                  controller: _rent,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (v) => Validators.positiveNumber(v, 'rent'),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: CustomTextField(
                  label: 'Security deposit (₹)',
                  controller: _deposit,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (v) => Validators.positiveNumber(v, 'deposit'),
                ),
              ),
            ]),
            const SizedBox(height: 16),
            CustomTextField(
              label: 'Description',
              hint: 'Fabric, occasion, any flaws…',
              controller: _desc,
              maxLines: 4,
            ),
            const SizedBox(height: 24),
            const Text('Verification photos',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 4),
            const Text(
              'Take at least 4 photos with your camera from different sides '
              'and angles. Gallery uploads are not accepted.',
              style: TextStyle(color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 14),
            _photoSlots(),
            if (_photoError != null) ...[
              const SizedBox(height: 8),
              Text(_photoError!,
                  style: const TextStyle(color: Colors.red, fontSize: 13)),
            ],
            const SizedBox(height: 14),
            CustomButton(
              label: _photos.isEmpty ? 'Open camera' : 'Retake / add photos',
              leadingIcon: Icons.photo_camera_outlined,
              style: CustomButtonStyle.outline,
              expanded: true,
              onPressed: _openCamera,
            ),
            const SizedBox(height: 22),
            CustomButton(
              label: 'Submit Listing',
              expanded: true,
              onPressed: _submit,
            ),
          ],
        ),
      );

  Widget _photoSlots() {
    final count = math.max(CameraCaptureScreen.minPhotos, _photos.length);
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < count; i++)
          i < _photos.length
              ? _slotFilled(_photos[i])
              : _slotEmpty(CameraCaptureScreen.angles[i]),
      ],
    );
  }

  Widget _slotFilled(CapturedPhoto p) => SizedBox(
        width: 96,
        height: 120,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Stack(fit: StackFit.expand, children: [
            Image.memory(p.bytes, fit: BoxFit.cover),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                color: Colors.black54,
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Text(p.angle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white, fontSize: 11)),
              ),
            ),
          ]),
        ),
      );

  Widget _slotEmpty(String label) => InkWell(
        onTap: _openCamera,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: 96,
          height: 120,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border, width: 1.5),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.photo_camera_outlined,
                  color: AppColors.textSecondary),
              const SizedBox(height: 6),
              Text(label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ),
      );

  Widget _dropdown(String label, String value, List<String> items,
      ValueChanged<String> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: (v) => onChanged(v ?? value),
        ),
      ],
    );
  }
}
