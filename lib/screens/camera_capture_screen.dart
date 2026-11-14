import 'dart:convert';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

import 'package:relooka/core/app_colors.dart';
import 'package:relooka/models/listing_model.dart';

/// Live camera capture for outfit verification.
///
/// Photos can only be taken with the camera here (there is no gallery
/// upload), one per angle. At least [minPhotos] are required. Pops with the
/// list of [CapturedPhoto] when the user taps Done.
class CameraCaptureScreen extends StatefulWidget {
  final List<CapturedPhoto> initial;

  const CameraCaptureScreen({super.key, this.initial = const []});

  static const minPhotos = 4;
  static const angles = [
    'Front',
    'Back',
    'Left side',
    'Right side',
    'Close-up detail',
    'Label / tag',
  ];
  static int get maxPhotos => angles.length;

  @override
  State<CameraCaptureScreen> createState() => _CameraCaptureScreenState();
}

class _CameraCaptureScreenState extends State<CameraCaptureScreen> {
  CameraController? _controller;
  String? _error;
  bool _busy = false;
  late final List<CapturedPhoto> _photos = List.of(widget.initial);

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (mounted) setState(() => _error = 'No camera was found on this device.');
        return;
      }
      final cam = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      final controller =
          CameraController(cam, ResolutionPreset.high, enableAudio: false);
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() => _controller = controller);
    } on CameraException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.code.contains('Denied')
            ? 'Camera permission was denied. Allow camera access in your '
                'browser / device settings and try again.'
            : 'Could not start the camera (${e.description ?? e.code}).';
      });
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not start the camera: $e');
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _loadSamplePhotos() {
    final sampleBytes = base64Decode(
      'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBhXY/jPwPA/AxgwMhABBgAPcAL/W6k2jAAAAABJRU5ErkJggg==',
    );
    setState(() {
      _photos.clear();
      for (final a in ['Front', 'Back', 'Left side', 'Close-up detail']) {
        _photos.add(CapturedPhoto(angle: a, bytes: sampleBytes));
      }
      _error = null;
    });
  }

  /// First angle in the guided list that has not been captured yet.
  String get _nextAngle {
    for (final a in CameraCaptureScreen.angles) {
      if (!_photos.any((p) => p.angle == a)) return a;
    }
    return 'Extra';
  }

  Future<void> _capture() async {
    final c = _controller;
    if (c == null ||
        !c.value.isInitialized ||
        _busy ||
        _photos.length >= CameraCaptureScreen.maxPhotos) {
      return;
    }
    setState(() => _busy = true);
    try {
      final angle = _nextAngle;
      final file = await c.takePicture();
      final bytes = await file.readAsBytes();
      if (!mounted) return;
      setState(() => _photos.add(CapturedPhoto(angle: angle, bytes: bytes)));
    } on CameraException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not take photo: ${e.description ?? e.code}')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _finish() {
    // Keep photos in the guided angle order.
    const order = CameraCaptureScreen.angles;
    final sorted = List.of(_photos)
      ..sort((a, b) => order.indexOf(a.angle).compareTo(order.indexOf(b.angle)));
    Navigator.of(context).pop(sorted);
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    final ready = c != null && c.value.isInitialized;
    final full = _photos.length >= CameraCaptureScreen.maxPhotos;
    final canFinish = _photos.length >= CameraCaptureScreen.minPhotos;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Verification photos'),
        actions: [
          TextButton(
            onPressed: _loadSamplePhotos,
            child: const Text('Sample Photos',
                style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _error != null
                  ? _errorView()
                  : !ready
                      ? const Center(child: CircularProgressIndicator())
                      : Stack(
                          alignment: Alignment.topCenter,
                          children: [
                            Center(child: CameraPreview(c)),
                            Positioned(
                              top: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  full
                                      ? 'Maximum photos reached'
                                      : 'Take: $_nextAngle',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                          ],
                        ),
            ),
            if (_photos.isNotEmpty)
              SizedBox(
                height: 92,
                child: ListView.separated(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  scrollDirection: Axis.horizontal,
                  itemCount: _photos.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => _thumb(i),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${_photos.length} of ${CameraCaptureScreen.minPhotos} '
                      'required photos',
                      style: TextStyle(
                          color: canFinish ? AppColors.accent : Colors.white70,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                  GestureDetector(
                    onTap: (ready && !_busy && !full) ? _capture : null,
                    child: Opacity(
                      opacity: (ready && !_busy && !full) ? 1 : 0.4,
                      child: Container(
                        width: 72,
                        height: 72,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                        child: Container(
                          decoration: const BoxDecoration(
                              color: Colors.white, shape: BoxShape.circle),
                          child: _busy
                              ? const Padding(
                                  padding: EdgeInsets.all(20),
                                  child:
                                      CircularProgressIndicator(strokeWidth: 3),
                                )
                              : null,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: FilledButton(
                        onPressed: canFinish ? _finish : null,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          foregroundColor: AppColors.dark,
                        ),
                        child: const Text('Done'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _thumb(int i) {
    final photo = _photos[i];
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.memory(photo.bytes, width: 64, height: 76, fit: BoxFit.cover),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            color: Colors.black54,
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Text(photo.angle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 9)),
          ),
        ),
        Positioned(
          top: 0,
          right: 0,
          child: GestureDetector(
            onTap: () => setState(() => _photos.removeAt(i)),
            child: const CircleAvatar(
              radius: 10,
              backgroundColor: Colors.black87,
              child: Icon(Icons.close, size: 13, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _errorView() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.videocam_off_outlined,
                  color: Colors.white70, size: 48),
              const SizedBox(height: 14),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, height: 1.4)),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: () {
                  setState(() => _error = null);
                  _initCamera();
                },
                child: const Text('Try again'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _loadSamplePhotos,
                icon: const Icon(Icons.photo_library_outlined, size: 18),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.accent,
                  side: const BorderSide(color: AppColors.accent),
                ),
                label: const Text('Use Sample Verification Photos'),
              ),
            ],
          ),
        ),
      );
}
