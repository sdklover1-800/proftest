from pydantic import BaseModel, Field


class TestConfigBase(BaseModel):
    riasec_limit: int = Field(default=10, ge=0)
    big5_limit: int = Field(default=10, ge=0)
    sjt_limit: int = Field(default=10, ge=0)
    cognitive_limit: int = Field(default=10, ge=0)


class TestConfigUpdate(TestConfigBase):
    pass


class TestConfigOut(TestConfigBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
