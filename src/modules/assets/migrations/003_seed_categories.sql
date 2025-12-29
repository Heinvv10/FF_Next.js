-- Asset Management Module - Seed Data
-- Migration: 003_seed_categories.sql
-- Description: Seeds initial asset categories for Velocity Fibre

-- =====================================================
-- SEED ASSET CATEGORIES
-- =====================================================

INSERT INTO asset_categories (name, code, type, description, requires_calibration, calibration_interval_days, depreciation_years)
VALUES
    -- Test Equipment (requires calibration)
    ('EXFO OTDR', 'OTDR', 'test_equipment', 'Optical Time Domain Reflectometer for fiber testing', TRUE, 365, 5),
    ('EXFO Power Meter', 'PMTR', 'test_equipment', 'Optical power meter for loss measurement', TRUE, 365, 5),
    ('EXFO Light Source', 'LSRC', 'test_equipment', 'Optical light source for testing', TRUE, 365, 5),
    ('Visual Fault Locator', 'VFL', 'test_equipment', 'Visual fault locator for fiber breaks', TRUE, 365, 3),
    ('Fiber Identifier', 'FIDN', 'test_equipment', 'Non-intrusive fiber identifier', TRUE, 365, 5),

    -- Splice Equipment
    ('Fusion Splicer', 'FSPL', 'splice_equipment', 'Fusion splicer for fiber joining', TRUE, 365, 7),
    ('Fiber Cleaver', 'CLVR', 'splice_equipment', 'Precision fiber cleaver', TRUE, 180, 3),
    ('Electrode Set', 'ELEC', 'splice_equipment', 'Fusion splicer electrode replacement set', FALSE, NULL, 1),
    ('Fiber Stripper', 'STRP', 'splice_equipment', 'Fiber optic cable stripper', FALSE, NULL, 2),
    ('Splice Sleeve Kit', 'SLVK', 'splice_equipment', 'Heat shrink splice protection sleeves', FALSE, NULL, 1),

    -- Computing Devices
    ('Laptop', 'LTOP', 'computing_device', 'Company laptop computer', FALSE, NULL, 3),
    ('Tablet', 'TBLT', 'computing_device', 'Field tablet device', FALSE, NULL, 3),
    ('Mobile Phone', 'PHON', 'computing_device', 'Company mobile phone', FALSE, NULL, 2),
    ('GPS Unit', 'GPSU', 'computing_device', 'GPS navigation unit', FALSE, NULL, 3),
    ('Rugged Handheld', 'RHND', 'computing_device', 'Rugged handheld data collector', FALSE, NULL, 4),

    -- Tools & Hand Tools
    ('Extension Ladder', 'LADR', 'tools', 'Extension ladder for aerial work', FALSE, NULL, 10),
    ('Power Drill', 'DRLL', 'tools', 'Cordless power drill', FALSE, NULL, 5),
    ('Tool Kit - Fiber', 'TKIT', 'tools', 'Complete fiber optic tool kit', FALSE, NULL, 5),
    ('Cable Cutter', 'CCUT', 'tools', 'Heavy duty cable cutter', FALSE, NULL, 5),
    ('Crimping Tool', 'CRMP', 'tools', 'RJ45/Fiber connector crimping tool', FALSE, NULL, 5),
    ('Wire Stripper Set', 'WSTR', 'tools', 'Multi-purpose wire stripper set', FALSE, NULL, 3),
    ('Multimeter', 'MMTR', 'tools', 'Digital multimeter', TRUE, 365, 5),
    ('Cable Tester', 'CTST', 'tools', 'Network cable tester', TRUE, 365, 3),

    -- Vehicles
    ('Company Vehicle', 'VHCL', 'vehicle', 'Company vehicle', FALSE, NULL, 5),
    ('Service Van', 'SVAN', 'vehicle', 'Equipped service van', FALSE, NULL, 5),
    ('Bakkie/Pickup', 'BKKE', 'vehicle', 'Bakkie/Pickup truck', FALSE, NULL, 5),

    -- Safety Equipment
    ('Safety Harness', 'HARN', 'safety_equipment', 'Fall protection safety harness', TRUE, 365, 5),
    ('Hard Hat', 'HHAT', 'safety_equipment', 'Safety hard hat', FALSE, NULL, 2),
    ('Safety Glasses', 'SGLS', 'safety_equipment', 'Protective safety glasses', FALSE, NULL, 1),
    ('High Vis Vest', 'HVIS', 'safety_equipment', 'High visibility safety vest', FALSE, NULL, 2),
    ('First Aid Kit', 'FAID', 'safety_equipment', 'Portable first aid kit', FALSE, NULL, 3)

ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    requires_calibration = EXCLUDED.requires_calibration,
    calibration_interval_days = EXCLUDED.calibration_interval_days,
    depreciation_years = EXCLUDED.depreciation_years,
    updated_at = NOW();
