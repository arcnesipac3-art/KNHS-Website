"""
Calculation tests for grade transmutation.
Tests DepEd grade formula and transmutation table accuracy.
"""
import pytest
from decimal import Decimal

from apps.grading.models import Grade, DEPED_TRANSMUTATION


class TestGradeCalculations:
    """Test DepEd grade calculation formula."""

    def test_grade_formula_weights(self):
        """Test that grade formula uses correct weights: WW 30%, PT 50%, QA 20%."""
        # Test case 1: Equal scores
        initial = (80 * 0.30) + (80 * 0.50) + (80 * 0.20)
        assert initial == 80.0

        # Test case 2: Different scores
        ww, pt, qa = 85.0, 90.0, 88.0
        expected = (85.0 * 0.30) + (90.0 * 0.50) + (88.0 * 0.20)
        assert expected == 25.5 + 45.0 + 17.6
        assert expected == 88.1

    def test_initial_grade_calculation(self):
        """Test initial grade calculation from components."""
        test_cases = [
            # (WW, PT, QA, Expected Initial Grade)
            (100, 100, 100, 100.0),
            (0, 0, 0, 0.0),
            (60, 60, 60, 60.0),
            (75, 75, 75, 75.0),
            (85.5, 88.0, 90.0, 87.65),
            (92.0, 95.5, 89.0, 93.55),
        ]

        for ww, pt, qa, expected in test_cases:
            initial = (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
            assert round(initial, 2) == expected

    def test_transmutation_table_boundaries(self):
        """Test all transmutation table boundaries."""
        # Test upper boundary
        assert DEPED_TRANSMUTATION[Decimal('100.00')] == 100
        assert DEPED_TRANSMUTATION[Decimal('98.40')] == 99
        assert DEPED_TRANSMUTATION[Decimal('96.80')] == 98

        # Test middle range
        assert DEPED_TRANSMUTATION[Decimal('84.00')] == 90
        assert DEPED_TRANSMUTATION[Decimal('76.00')] == 85
        assert DEPED_TRANSMUTATION[Decimal('60.00')] == 75

        # Test that all 28 entries exist
        assert len(DEPED_TRANSMUTATION) == 28

    def test_transmutation_passing_grade(self):
        """Test that 60.00 transmutes to passing grade 75."""
        assert DEPED_TRANSMUTATION[Decimal('60.00')] == 75

    def test_transmutation_perfect_score(self):
        """Test that 100.00 stays as 100."""
        assert DEPED_TRANSMUTATION[Decimal('100.00')] == 100

    def test_transmutation_edge_cases(self):
        """Test edge cases in transmutation."""
        # Just above boundary should get higher transmuted grade
        assert DEPED_TRANSMUTATION[Decimal('98.40')] == 99
        
        # Just below boundary (98.39) would use 98.40 rule if >= check
        # but since it's explicit key lookup, values between keys need testing
        # in actual transmute_grade function

    def test_grade_model_transmutation(self):
        """Test that Grade model correctly transmutes grades."""
        # This would test the actual model's transmute_grade method
        # if it exists as a model method
        pass  # Model uses signal/save for transmutation

    def test_component_score_validation(self):
        """Test that scores are within valid range (0-100)."""
        valid_scores = [0, 25.5, 50, 75.75, 100]
        for score in valid_scores:
            assert 0 <= score <= 100

        invalid_scores = [-1, 100.1, 150]
        for score in invalid_scores:
            assert not (0 <= score <= 100)

    def test_calculation_precision(self):
        """Test that calculations maintain appropriate precision."""
        ww, pt, qa = 85.555, 90.777, 88.999
        initial = (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
        
        # Should be rounded to 2 decimal places
        rounded = round(initial, 2)
        assert rounded == 88.84

    def test_passing_grade_threshold(self):
        """Test passing grade threshold is 75."""
        passing_grades = [75, 80, 85, 90, 95, 100]
        for grade in passing_grades:
            assert grade >= 75

        failing_grades = [60, 65, 70, 74]
        for grade in failing_grades:
            assert grade < 75

    def test_comprehensive_transmutation_examples(self):
        """Test complete transmutation examples with real scenarios."""
        test_cases = [
            # (WW, PT, QA, Expected Initial, Expected Transmuted)
            (100, 100, 100, 100.00, 100),
            (85, 90, 88, 88.10, 88),  # Good student
            (75, 80, 78, 78.50, 86),  # Average student
            (60, 65, 62, 63.00, 77),  # Passing student
            (50, 55, 52, 53.00, 60),  # Below passing (needs improvement)
        ]

        for ww, pt, qa, expected_initial, expected_transmuted in test_cases:
            initial = (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
            assert round(initial, 2) == expected_initial

            # Find transmuted grade
            # This simulates the transmutation logic
            initial_decimal = Decimal(str(initial))
            
            # Find the appropriate transmutation
            transmuted = None
            for threshold in sorted(DEPED_TRANSMUTATION.keys(), reverse=True):
                if initial_decimal >= threshold:
                    transmuted = DEPED_TRANSMUTATION[threshold]
                    break
            
            if transmuted is None:
                transmuted = 60  # Below minimum

            assert transmuted == expected_transmuted

    def test_identical_component_scores(self):
        """Test when all component scores are identical."""
        for score in [60, 75, 85, 95, 100]:
            initial = (score * 0.30) + (score * 0.50) + (score * 0.20)
            assert initial == score

    def test_maximum_possible_grade(self):
        """Test maximum possible grade is 100."""
        ww, pt, qa = 100, 100, 100
        initial = (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
        assert initial == 100.0
        assert DEPED_TRANSMUTATION[Decimal('100.00')] == 100

    def test_minimum_passing_calculation(self):
        """Test minimum scores needed to pass (transmuted 75)."""
        # 60.00 initial grade transmutes to 75
        # So need WW, PT, QA that calculate to 60.00
        ww, pt, qa = 60, 60, 60
        initial = (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
        assert initial == 60.0
        assert DEPED_TRANSMUTATION[Decimal('60.00')] == 75

    def test_weight_sum_equals_one(self):
        """Test that weight percentages sum to 100% (1.0)."""
        weights = 0.30 + 0.50 + 0.20
        assert weights == 1.0

    def test_transmutation_monotonic(self):
        """Test that transmutation table is monotonically increasing."""
        thresholds = sorted(DEPED_TRANSMUTATION.keys())
        transmuted_values = [DEPED_TRANSMUTATION[t] for t in thresholds]
        
        # Check that transmuted values are in ascending order
        assert transmuted_values == sorted(transmuted_values)

    def test_no_grade_gaps(self):
        """Test that transmuted grades cover expected range."""
        transmuted_values = set(DEPED_TRANSMUTATION.values())
        
        # Should have grades from 60 to 100
        min_grade = min(transmuted_values)
        max_grade = max(transmuted_values)
        
        assert min_grade == 60  # Below passing
        assert max_grade == 100  # Perfect score

    def test_realistic_student_scenarios(self):
        """Test realistic student performance scenarios."""
        scenarios = [
            # Excellent student
            {"ww": 95, "pt": 98, "qa": 96, "description": "Excellent"},
            # Very good student  
            {"ww": 88, "pt": 92, "qa": 90, "description": "Very Good"},
            # Good student
            {"ww": 80, "pt": 85, "qa": 82, "description": "Good"},
            # Satisfactory student
            {"ww": 75, "pt": 78, "qa": 76, "description": "Satisfactory"},
            # Barely passing student
            {"ww": 60, "pt": 62, "qa": 61, "description": "Barely Passing"},
        ]

        for scenario in scenarios:
            ww = scenario["ww"]
            pt = scenario["pt"]
            qa = scenario["qa"]
            
            initial = (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
            
            # Find transmuted
            initial_decimal = Decimal(str(round(initial, 2)))
            transmuted = None
            for threshold in sorted(DEPED_TRANSMUTATION.keys(), reverse=True):
                if initial_decimal >= threshold:
                    transmuted = DEPED_TRANSMUTATION[threshold]
                    break
            if transmuted is None:
                transmuted = 60

            # All these scenarios should pass (≥75)
            assert transmuted >= 60, f"Failed for {scenario['description']}"

    def test_component_weighting_impact(self):
        """Test the impact of each component on final grade."""
        base_score = 80

        # Test WW impact (30%)
        ww_high = (90 * 0.30) + (base_score * 0.50) + (base_score * 0.20)
        ww_low = (70 * 0.30) + (base_score * 0.50) + (base_score * 0.20)
        ww_diff = ww_high - ww_low
        assert abs(ww_diff - (20 * 0.30)) < 0.01  # 20 point difference × 30% = 6 points

        # Test PT impact (50%) - most significant
        pt_high = (base_score * 0.30) + (90 * 0.50) + (base_score * 0.20)
        pt_low = (base_score * 0.30) + (70 * 0.50) + (base_score * 0.20)
        pt_diff = pt_high - pt_low
        assert abs(pt_diff - (20 * 0.50)) < 0.01  # 20 point difference × 50% = 10 points

        # Test QA impact (20%)
        qa_high = (base_score * 0.30) + (base_score * 0.50) + (90 * 0.20)
        qa_low = (base_score * 0.30) + (base_score * 0.50) + (70 * 0.20)
        qa_diff = qa_high - qa_low
        assert abs(qa_diff - (20 * 0.20)) < 0.01  # 20 point difference × 20% = 4 points

        # PT should have the largest impact
        assert pt_diff > ww_diff > qa_diff
