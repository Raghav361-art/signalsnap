from app.routers.track import detect_device


def test_detect_device_mobile():
    user_agent = (
        "Mozilla/5.0 "
        "(iPhone; CPU iPhone OS 17_0 like Mac OS X) "
        "Mobile"
    )

    assert detect_device(user_agent) == "mobile"


def test_detect_device_tablet():
    user_agent = (
        "Mozilla/5.0 "
        "(iPad; CPU OS 17_0 like Mac OS X)"
    )

    assert detect_device(user_agent) == "tablet"


def test_detect_device_desktop():
    user_agent = (
        "Mozilla/5.0 "
        "(Macintosh; Intel Mac OS X 10_15_7)"
    )

    assert detect_device(user_agent) == "desktop"